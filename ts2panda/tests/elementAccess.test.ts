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
import {
    Add2Dyn,
    Imm,
    LdaDyn,
    LdaiDyn,
    LdObjByName,
    LdObjByValue,
    MovDyn,
    ResultType,
    StaDyn,
    StObjByName,
    VReg
} from "../src/irnodes";
import { checkInstructions, compileMainSnippet } from "./utils/base";

describe("ElementAccess", function() {
    it('get obj["property"]', function() {
        let insns = compileMainSnippet(`let obj;
                                obj["property"];`);

        let objReg = new VReg();

        let expected = [
            new LdaDyn(objReg),
            new StaDyn(objReg),
            new LdObjByName("property", objReg)
        ];

        insns = insns.slice(2, insns.length - 1); // cut off let obj and return.dyn
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it('set obj["property"]', function() {
        let insns = compileMainSnippet(`let obj;
                                obj["property"] = 5;`);
        let objReg = new VReg();
        let tempObj = new VReg();

        let expected = [
            new LdaDyn(objReg),
            new StaDyn(tempObj),
            new MovDyn(objReg, tempObj),
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StObjByName("property", objReg),
        ];

        insns = insns.slice(2, insns.length - 1); // cut off let obj and return.dyn
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it('get obj[1 + 2]', function() {
        let insns = compileMainSnippet(`let obj;
                                obj[1 + 2];`);
        let prop1Reg = new VReg();
        let objReg = new VReg();
        let val = new VReg();

        let expected = [
            new LdaDyn(objReg),
            new StaDyn(objReg),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StaDyn(prop1Reg),
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new Add2Dyn(prop1Reg),
            new StaDyn(val),
            new LdObjByValue(objReg, val)
        ];

        insns = insns.slice(2, insns.length - 1); // cut off let obj and return.dyn
        expect(checkInstructions(insns, expected)).to.be.true;
    });
});
