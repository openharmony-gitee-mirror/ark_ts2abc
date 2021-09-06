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

import {
    BuiltinR2i,
    Imm,
    IRNode,
    IRNodeKind,
    Label,
    OperandKind,
    VReg
} from "./irnodes";
import { generateCatchTables } from "./statement/tryStatement";
import { PandaGen } from "./pandagen";
import { CmdOptions } from "./cmdOptions";
import { builtinsCodeMap } from "./builtinsMap";

export class IntrinsicInfo {
    readonly intrinsicName: string;
    readonly argsNum: number;
    readonly returnType: string;

    constructor(intrinsicName: string, argsNum: number, returnType: string) {
        this.intrinsicName = intrinsicName;
        this.argsNum = argsNum;
        this.returnType = returnType;
    }
}

export class AssemblyDumper {
    private labels: Map<number, string> // Label.id : Label string name
    private labelId: number;
    private pg: PandaGen;
    readonly labelPrefix = "LABEL_";
    static intrinsicRec: Map<string, IntrinsicInfo> = new Map<string, IntrinsicInfo>();
    private output: string;

    constructor(pg: PandaGen) {
        this.pg = pg;
        this.labels = new Map<number, string>();
        this.labelId = 0;
        this.output = "";
    }

    static writeLanguageTag(out: any): void {
        out.str += ".language ECMAScript\n";
        out.str += "\n";
    }

    static writeIntrinsicDecl(out: any): void {
        out.str += ".record Ecmascript.Intrinsics <external>\n";
        AssemblyDumper.intrinsicRec.forEach((intrinsicInfo, mnemonic) => {
            out.str += ".function " + intrinsicInfo!.returnType + " Ecmascript.Intrinsics." + mnemonic + "(";
            let intrinsicArgNum = intrinsicInfo!.argsNum;
            for (let i = 0; i < intrinsicArgNum; i++) {
                out.str += "any a" + i.toString();
                if (i != intrinsicArgNum - 1) {
                    out.str += ", ";
                }
            }
            out.str += ") <external>\n";
        })
    }

    writeFunctionHeader(): void {
        let parametersCount = this.pg.getParametersCount();
        this.output += ".function any " + this.pg.internalName + "("
        for (let i = 0; i < parametersCount; ++i) {
            this.output += "any a" + i.toString();
            if (i !== parametersCount - 1) {
                this.output += ", ";
            }
        }
        this.output += ") {\n";
    }

    writeFunctionBody(): void {
        let irNodes: IRNode[] = this.pg.getInsns();
        let parametersCount = this.pg.getParametersCount();

        /* the first parametersCount insns are mov.dyn insns for argument initialization,
           we can directly dump them into text
        */
        for (let i = 0; i < parametersCount; ++i) {
            let node = irNodes[i];
            this.output += "\t";
            this.output += node.mnemonic + " v" + (<VReg>node.operands[0]).num + ", a" + ((<VReg>node.operands[0]).num) + "\n";
        }

        for (let i = parametersCount; i < irNodes.length; ++i) {
            let node = irNodes[i];
            if (node.kind === IRNodeKind.VREG || node.kind === IRNodeKind.IMM) {
                continue;
            }
            if (node.kind === IRNodeKind.LABEL) {
                this.writeLabel(<Label>node);
                continue;
            }

            this.output += "\t"
            this.output += node.mnemonic + " ";
            let operands = node.operands;
            let formats = node.formats;
            for (let j = 0; j < operands.length; ++j) {
                let format = formats[0];
                let kind = format[j].kind;
                let op = operands[j];

                if (kind == OperandKind.Imm) {
                    let imm = <Imm>op;
                    this.output += imm.value.toString();
                } else if (kind == OperandKind.Id) {
                    this.output += op;
                } else if (kind == OperandKind.StringId) {
                    let escapedOp = op.toString().replace(/\\/g, "\\\\").replace(/\t/g, "\\t")
                        .replace(/\n/g, "\\n").replace(/\"/g, "\\\"")
                    this.output += "\"" + escapedOp + "\"";
                } else if (kind == OperandKind.DstVReg
                    || kind == OperandKind.SrcDstVReg
                    || kind == OperandKind.SrcVReg) {
                    let v = <VReg>op;
                    if (v.num < 0) {
                        throw Error("invalid register, please check your insn!\nRegister was allocated at:\n" + v.getStackTrace() + "\n");
                    }
                    this.output += "v" + v.num.toString();
                    if (node instanceof BuiltinR2i) {
                        break; // we don't need to print all the registers, just the first one
                    }
                } else if (kind == OperandKind.Label) {
                    this.output += this.getLabelName(<Label>op);
                } else {
                    throw new Error("Unexpected OperandKind");
                }
                if (j < operands.length - 1) {
                    this.output += ", ";
                }
            }
            if (CmdOptions.isVariantBytecode()) {
                if (node.mnemonic.startsWith('builtin')) {
                    if (node.operands[0] instanceof Imm) {
                        let subcode = node.operands[0].value;
                        this.output += "  # " + (builtinsCodeMap as any)[node.mnemonic][subcode];
                    } else {
                        throw new Error("can't go here" + node.toString());
                    }
                }
            }
            this.output += "\n";
        }
    }

    writeFunctionTail(): void {
        this.output += "}\n";
    }

    writeFunctionCatchTable(): void {
        let catchTables = generateCatchTables(this.pg.getCatchMap());
        if (catchTables.length == 0) {
            return;
        }

        this.output += "\n";
        catchTables.forEach((catchTable) => {
            let catchBeginLabel = catchTable.getCatchBeginLabel();
            let labelPairs = catchTable.getLabelPairs();
            labelPairs.forEach((labelPair) => {
                this.output += ".catchall " + this.getLabelName(labelPair.getBeginLabel())
                    + ", " + this.getLabelName(labelPair.getEndLabel())
                    + ", " + this.getLabelName(catchBeginLabel)
                    + "\n"
            });
        });
    }

    getLabelName(label: Label): string {
        let labelName: string;
        if (!this.labels.has(label.id)) {
            labelName = this.labelPrefix + this.labelId++;
            this.labels.set(label.id, labelName);
        } else {
            labelName = this.labels.get(label.id)!;
        }
        return labelName;
    }

    writeLabel(label: Label): void {
        let labelName = this.getLabelName(label);
        this.output += labelName + ":\n";
    }

    dump(): void {
        this.writeFunctionHeader();
        this.writeFunctionBody();
        this.writeFunctionCatchTable();
        this.writeFunctionTail();

        console.log(this.output);
    }

    static dumpHeader(): void {
        let out = { str: "" };
        AssemblyDumper.writeLanguageTag(out);
        if (!CmdOptions.isVariantBytecode()) {
            AssemblyDumper.writeIntrinsicDecl(out);
        }
        console.log(out.str)
    }
}
