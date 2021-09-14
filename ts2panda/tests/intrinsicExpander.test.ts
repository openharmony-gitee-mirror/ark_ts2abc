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
    expect
} from 'chai';
import 'mocha';
import { IntrinsicExpanderInternal } from "../src/intrinsicExpander";
import {
    And2Dyn,
    CallShort,
    FormatItem,
    Intrinsic,
    IRNodeKind,
    OperandKind,
    ResultDst,
    ResultType,
    Shl2Dyn,
    VReg
} from "../src/irnodes";
import { checkInstructions } from "./utils/base";

describe("InstructionExpanderTest", function() {
    it("test expander saves acc", function() {
        let expander = new IntrinsicExpanderInternal();
        let lhs = new VReg();
        let insns = expander.expandInstruction(new Shl2Dyn(lhs))[0];
        let expected = [
            new CallShort("Ecmascript.Intrinsics.shl2Dyn", lhs)
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("test expander restores acc", function() {
        class FakeDyn extends Intrinsic {
            constructor(vs: VReg) {
                super(
                    IRNodeKind.VREG,
                    "fakeDyn",
                    [vs],
                    [
                        [new FormatItem(OperandKind.SrcVReg, 8)]
                    ]
                );
            }

            usesAcc(): boolean {
                return false;
            }

            resultType(): ResultType {
                return ResultType.None;
            }

            resultIn(): ResultDst {
                return ResultDst.None;
            }
        };

        let expander = new IntrinsicExpanderInternal();
        let vs = new VReg();
        let insns = expander.expandInstruction(new FakeDyn(vs))[0];
        let funcReg = new VReg();
        let expected = [
            new CallShort("Ecmascript.Intrinsics.fakeDyn", funcReg),
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("test expander for And2Dyn", function() {
        let expander = new IntrinsicExpanderInternal();
        let v1 = new VReg();
        let insns = expander.expandInstruction(new And2Dyn(v1))[0];
        let lhs = new VReg();
        let expected = [
            new CallShort("Ecmascript.Intrinsics.and2Dyn", lhs)
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    })
});

