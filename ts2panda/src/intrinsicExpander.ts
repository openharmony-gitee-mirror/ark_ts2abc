/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AssemblyDumper, IntrinsicInfo } from "./assemblyDumper";
import { DebugInfo } from "./debuginfo";
import {
    Call,
    CallRange,
    CallShort,
    FldaiDyn,
    Imm,
    Intrinsic,
    IRNode,
    LdaiDyn,
    LdaStr,
    OperandKind,
    ResultDst,
    ResultType,
    StaDyn,
    VReg
} from "./irnodes";
import { PandaGen } from "./pandagen";
import { Pass } from "./pass";

export class IntrinsicExpanderInternal {
    private temps: VReg[] = [];

    getTemp(): VReg {
        if (this.temps.length > 0) {
            return this.temps.pop()!;
        } else {
            return new VReg();
        }
    }

    freeTemps(temps: VReg[]) {
        this.temps = this.temps.concat(temps);
    }

    // this method records the intrinsic usage during the whole source code
    // it can help dumper to write the intrinsic function declaration in the front of bytecode
    intrinsicDeclRec(ins: Intrinsic) {
        let intrinsicName = ins.mnemonic;
        let argsNum = ins.operands.length;
        let resultType: string = "";
        if (ins.resultIn() == ResultDst.None) {
            resultType = "void";
        } else if (ins.resultIn() == ResultDst.Acc) {
            resultType = "any";
        } else {
            throw new Error("resultType of" + ins.resultIn() + "is not implement");
        }
        let intrinsicInfo = new IntrinsicInfo(intrinsicName, argsNum, resultType);
        AssemblyDumper.intrinsicRec.set(ins.mnemonic, intrinsicInfo);
    }

    // Transforms a synthetic "intrinsic instruction" into an intrinsic function call.
    // Returns an array of instructions forming intrinsic call and
    // an array of temporary registers used for expansion.
    expandInstruction(ins: Intrinsic): [IRNode[], VReg[]] {
        let operands = ins.operands;
        let formats = ins.formats;
        let expansion: IRNode[] = [];
        let callArgs: VReg[] = [];
        let tempVregs: VReg[] = [];

        let intrinsicName = "Ecmascript.Intrinsics." + ins.mnemonic;

        // Walk the rest of the arguments.
        for (let i = 0; i < operands.length; ++i) {
            let format = formats[0];
            let kind: OperandKind;
            kind = format[i].kind;

            let operand = operands[i];

            if (kind === OperandKind.SrcVReg) {
                callArgs.push(<VReg>operand);
                continue;
            }

            // Imm has to be put into a vreg to be passed to intrinsic.
            // for defineFuncDyn
            if (kind === OperandKind.Imm) {
                let tempImm: VReg = this.getTemp();
                let imm = <Imm>operand;
                let type = imm.resultType();
                if (type == ResultType.Int || type == ResultType.Long) {
                    expansion.push(new LdaiDyn(imm));
                } else if (type == ResultType.Float) {
                    expansion.push(new FldaiDyn(imm));
                } else {
                    throw new Error("Unexpected result type for an Imm");
                }
                expansion.push(new StaDyn(tempImm));
                callArgs.push(tempImm);
                tempVregs.push(tempImm);
                continue;
            }

            // Put id into vreg as a string object.
            if (kind === OperandKind.Id) {
                let tempId: VReg = this.getTemp();
                expansion.push(new LdaStr(<string>operand));
                expansion.push(new StaDyn(tempId));
                callArgs.push(tempId);
                tempVregs.push(tempId);
                continue;
            }

            // For simplicity, intrinsics shall not have destinations other than accumulator.
            // Also, no labels are allowed as operands.
            if (kind === OperandKind.DstVReg
                || kind === OperandKind.SrcDstVReg
                || ins.resultIn() === ResultDst.VReg) {
                throw new Error("Intrinsic " + ins.mnemonic + " has unexpected operand kinds");
            } else {
                throw new Error("Unknown operand kind for intrinsic " + ins.mnemonic);
            }
        }

        // Call the intrinsic.
        switch (callArgs.length) {
            case 0:
                expansion.push(new CallShort(intrinsicName));
                break;
            case 1:
                expansion.push(new CallShort(intrinsicName, callArgs[0]));
                break;
            case 2:
                expansion.push(new CallShort(intrinsicName, callArgs[0], callArgs[1]));
                break;
            case 3:
                expansion.push(new Call(intrinsicName, callArgs[0], callArgs[1], callArgs[2]));
                break;
            case 4:
                expansion.push(new Call(intrinsicName, callArgs[0], callArgs[1], callArgs[2], callArgs[3]));
                break;
            default:
                expansion.push(new CallRange(intrinsicName, callArgs));
        }
        return [expansion, tempVregs];
    }

    run(pg: PandaGen): void {
        let insns: IRNode[] = pg.getInsns();
        let origTemps: VReg[] = pg.getTemps();

        for (let i = 0; i < insns.length; ++i) {
            let ins: IRNode = insns[i];
            if (ins instanceof Intrinsic) {
                // record the intrinsic
                if (!AssemblyDumper.intrinsicRec.has(ins.mnemonic)) {
                    this.intrinsicDeclRec(ins);
                }

                let [expansion, temps] = this.expandInstruction(ins);

                // for debuginfo
                DebugInfo.copyDebugInfo(insns[i], expansion);

                insns.splice(i, 1, ...expansion);
                // Since we put something into the original array, its length changed.
                // Skip what we've just added.
                let step = expansion.length - 1;
                i += step;

                this.freeTemps(temps);
            }
        }
        // We need extra registers in the function.
        origTemps.push(...this.temps);
    }
}
export class IntrinsicExpander implements Pass {
    run(pg: PandaGen): void {
        let intrinsicExpanderInternal = new IntrinsicExpanderInternal();
        intrinsicExpanderInternal.run(pg);
    }
}
