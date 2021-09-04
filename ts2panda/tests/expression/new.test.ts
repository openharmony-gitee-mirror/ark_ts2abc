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
    CreateEmptyArray,
    Imm,
    LdaDyn,
    LdaiDyn,
    LdObjByName,
    MovDyn,
    NewObjDynRange,
    NewobjSpread,
    ResultType,
    ReturnUndefined,
    StaDyn,
    StArraySpread,
    TryLdGlobalByName,
    VReg
} from "../../src/irnodes";
import { checkInstructions, compileMainSnippet } from "../utils/base";

describe("NewTest", function() {
    it("new Object", function() {
        let insns = compileMainSnippet("new Object");
        let arg0 = new VReg();
        let targetReg = new VReg();

        let expected = [
            new TryLdGlobalByName("Object"),
            new StaDyn(arg0),
            new MovDyn(targetReg, arg0),

            new NewObjDynRange(new Imm(ResultType.Int, 2), [arg0, targetReg]),

            new ReturnUndefined()
        ];

        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("new Object()", function() {
        let insns = compileMainSnippet("new Object()");
        let arg0 = new VReg();
        let targetReg = new VReg();

        let expected = [
            new TryLdGlobalByName("Object"),
            new StaDyn(arg0),
            new MovDyn(targetReg, arg0),

            new NewObjDynRange(new Imm(ResultType.Int, 2), [arg0, targetReg]),

            new ReturnUndefined()
        ];

        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("new Object(2)", function() {
        let insns = compileMainSnippet("new Object(2)");
        let arg0 = new VReg();
        let arg1 = new VReg();
        let targetReg = new VReg();

        let expected = [
            new TryLdGlobalByName("Object"),
            new StaDyn(arg0),
            new MovDyn(targetReg, arg0),

            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(arg1),

            new NewObjDynRange(new Imm(ResultType.Int, 3), [arg0, targetReg, arg1]),

            new ReturnUndefined()
        ];

        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("new obj.ctor()", function() {
        let insns = compileMainSnippet("let obj; new obj.ctor()");
        let obj = new VReg();
        let arg0 = new VReg();
        let temp = new VReg();
        let targetReg = new VReg();

        let expected = [
            new LdaDyn(obj),
            new StaDyn(temp),

            new LdObjByName("ctor", obj),
            new StaDyn(arg0),
            new MovDyn(targetReg, arg0),

            new NewObjDynRange(new Imm(ResultType.Int, 2), [arg0, targetReg]),
        ];

        insns = insns.slice(2, insns.length - 1);

        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("new Object(...args)", function() {
        let insns = compileMainSnippet(`new Object(...args);`);
        let arg0 = new VReg();
        let elemIdxReg = new VReg();
        let targetReg = new VReg();
        let arrayInstance = new VReg();

        let expected = [
            new TryLdGlobalByName("Object"),
            new StaDyn(arg0),
            new MovDyn(targetReg, arg0),

            new CreateEmptyArray(),
            new StaDyn(arrayInstance),
            new LdaiDyn(new Imm(ResultType.Int, 0)),
            new StaDyn(elemIdxReg),

            new TryLdGlobalByName("args"),
            new StArraySpread(arrayInstance, elemIdxReg),
            new StaDyn(elemIdxReg),
            new LdaDyn(arrayInstance),

            new NewobjSpread(arg0, targetReg),

            new ReturnUndefined()
        ];

        expect(checkInstructions(insns, expected)).to.be.true;
    });
});
