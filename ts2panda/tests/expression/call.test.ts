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
    Call0Dyn,
    Call1Dyn,
    CalliThisRangeDyn,
    CallSpread,
    CreateArrayWithBuffer,
    CreateEmptyArray,
    Imm,
    LdaDyn,
    LdaiDyn,
    LdObjByName,
    LdObjByValue,
    ResultType,
    ReturnUndefined,
    StaDyn,
    StArraySpread,
    TryLdGlobalByName,
    VReg
} from "../../src/irnodes";
import { checkInstructions, compileMainSnippet } from "../utils/base";

describe("CallTest", function() {
    it("no arg call of a global standalone function", function() {
        let insns = compileMainSnippet(`
      foo();
      `);
        let arg0 = new VReg();
        let expected = [
            new TryLdGlobalByName("foo"),
            new StaDyn(arg0),
            new Call0Dyn(arg0),

            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("one arg call of a global standalone function", function() {
        let insns = compileMainSnippet(`
      let i = 5;
      foo(i);
      `);
        let i = new VReg();
        let arg0 = new VReg();
        let arg2 = new VReg();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StaDyn(i),
            new TryLdGlobalByName("foo"),
            new StaDyn(arg0),
            new LdaDyn(i),
            new StaDyn(arg2),
            new Call1Dyn(arg0, arg2),

            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("call method", function() {
        let insns = compileMainSnippet(`
      Foo.method();
      `);
        let obj = new VReg();
        let arg0 = new VReg();
        let arg1 = new VReg();
        let expected = [
            new TryLdGlobalByName("Foo"),
            new StaDyn(arg0),
            new LdObjByName("method", arg0),
            new StaDyn(arg1),
            new CalliThisRangeDyn(new Imm(ResultType.Int, 1), [arg1, obj]),

            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("spread element call of a global standalone function", function() {
        let insns = compileMainSnippet(`
       const args = [1, 2];
       myFunction(...args);
      `);
        let arg0 = new VReg();
        let globalEnv = new VReg();
        let lengthReg = new VReg();
        let arrayInstance = new VReg();
        let objReg = new VReg();

        let expected = [
            new CreateArrayWithBuffer(new Imm(ResultType.Int, 0)),
            new StaDyn(arrayInstance),
            new LdaDyn(arrayInstance),
            new StaDyn(objReg),

            new TryLdGlobalByName("myFunction"),
            new StaDyn(arg0),

            new CreateEmptyArray(),
            new StaDyn(arrayInstance),
            new LdaiDyn(new Imm(ResultType.Int, 0)),
            new StaDyn(lengthReg),
            new LdaDyn(objReg),
            new StArraySpread(arrayInstance, lengthReg),
            new StaDyn(lengthReg),
            new LdaDyn(arrayInstance),

            new CallSpread(arg0, globalEnv, arrayInstance),

            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("call by element access", function() {
        let insns = compileMainSnippet(`
            Foo[method]();
            `);
        let obj = new VReg();
        let prop = new VReg();
        let arg0 = new VReg();
        let arg1 = new VReg();
        let expected = [
            new TryLdGlobalByName("Foo"),
            new StaDyn(arg0),
            new TryLdGlobalByName("method"),
            new StaDyn(prop),
            new LdObjByValue(arg0, prop),
            new StaDyn(arg1),
            new CalliThisRangeDyn(new Imm(ResultType.Int, 1), [arg1, obj]),

            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });
});
