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
import { DiagnosticCode } from '../src/diagnostic';
import {
    Add2Dyn,
    CreateArrayWithBuffer,
    CreateEmptyArray,
    CreateEmptyObject,
    CreateObjectWithBuffer,
    Imm,
    IncDyn,
    LdaDyn,
    LdaiDyn,
    LdaStr,
    MovDyn,
    NewObjDynRange,
    ResultType,
    ReturnUndefined,
    StaDyn,
    StArraySpread,
    StOwnByIndex,
    StOwnByName,
    StOwnByValue,
    TryLdGlobalByName,
    VReg
} from "../src/irnodes";
import { checkInstructions, compileMainSnippet } from "./utils/base";

describe("LiteralTest", function() {
    it("5", function() {
        let insns = compileMainSnippet("5");
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("\"stringLiteral\"", function() {
        let insns = compileMainSnippet("\"stringLiteral\"");
        let expected = [
            new LdaStr("stringLiteral"),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("true", function() {
        let insns = compileMainSnippet("true");
        let expected = [
            new LdaDyn(new VReg()),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("false", function() {
        let insns = compileMainSnippet("false");
        let expected = [
            new LdaDyn(new VReg()),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("null", function() {
        let insns = compileMainSnippet("null");
        let expected = [
            new LdaDyn(new VReg()),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("let arr = [1]", function() {
        let insns = compileMainSnippet("let arr = [1]");
        let arrayInstance = new VReg();
        let arrayReg = new VReg();

        let expected = [
            new CreateArrayWithBuffer(new Imm(ResultType.Int, 0)),
            new StaDyn(arrayInstance),
            new LdaDyn(arrayInstance),
            new StaDyn(arrayReg),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("let arr = []", function() {
        let insns = compileMainSnippet("let arr = []");
        let arrayInstance = new VReg();
        let arrayReg = new VReg();

        let expected = [
            new CreateEmptyArray(),
            new StaDyn(arrayInstance),
            new StaDyn(arrayReg),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("let arr = [1, 2]", function() {
        let insns = compileMainSnippet("let arr = [1, 2]");
        let arrayInstance = new VReg();

        let expected = [
            new CreateArrayWithBuffer(new Imm(ResultType.Int, 0)),
            new StaDyn(arrayInstance),
            new LdaDyn(arrayInstance),
        ];
        insns = insns.slice(0, insns.length - 2);
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("let arr = [, 1]", function() {
        let insns = compileMainSnippet("let arr = [, 1]");
        let elemIdxReg = new VReg();
        let arrayInstance = new VReg();
        let targetReg = new VReg();

        let expected = [
            new CreateEmptyArray(),
            new StaDyn(arrayInstance),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StaDyn(targetReg),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StaDyn(elemIdxReg),
            new LdaDyn(targetReg),
            new StOwnByIndex(arrayInstance, elemIdxReg),
            new LdaDyn(arrayInstance)
        ];
        insns = insns.slice(0, insns.length - 2);
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("let arr = [1, , 3]", function() {
        let insns = compileMainSnippet("let arr = [1,, 3]");
        let elemIdxReg = new VReg();
        let arrayInstance = new VReg();
        let targetReg = new VReg();

        let expected = [
            new CreateArrayWithBuffer(new Imm(ResultType.Int, 0)),
            new StaDyn(arrayInstance),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StaDyn(targetReg),
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(elemIdxReg),
            new LdaDyn(targetReg),
            new StOwnByIndex(arrayInstance, elemIdxReg),
            new LdaDyn(arrayInstance)
        ];

        insns = insns.slice(0, insns.length - 2);
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("let arr = [1, ...arr1, 3]", function() {
        let insns = compileMainSnippet(`let arr1 = [1, 2];
                                let arr = [1, ...arr1, 3]`);
        let arr = new VReg();
        let elemIdxReg = new VReg();
        let arrayInstance = new VReg();

        let expected = [
            new CreateArrayWithBuffer(new Imm(ResultType.Int, 0)),
            new StaDyn(arrayInstance),
            new LdaDyn(arrayInstance),
            new StaDyn(arr),

            new CreateArrayWithBuffer(new Imm(ResultType.Int, 1)),
            new StaDyn(arrayInstance),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StaDyn(elemIdxReg),
            new LdaDyn(arr),
            new StArraySpread(arrayInstance, elemIdxReg),
            new StaDyn(elemIdxReg),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StOwnByValue(arrayInstance, elemIdxReg),
            new IncDyn(elemIdxReg),
            new StaDyn(elemIdxReg),
            new LdaDyn(arrayInstance),
        ];
        insns = insns.slice(0, insns.length - 2);
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("let obj = {}", function() {
        let insns = compileMainSnippet("let obj = {}");
        let objInstance = new VReg();
        let obj = new VReg();

        let expected = [
            new CreateEmptyObject(),
            new StaDyn(objInstance),

            new StaDyn(obj),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("let obj = {a: 1}", function() {
        let insns = compileMainSnippet("let obj = {a: 1}");
        let objInstance = new VReg();
        let obj = new VReg();

        let expected = [
            new CreateObjectWithBuffer(new Imm(ResultType.Int, 0)),
            new StaDyn(objInstance),
            new LdaDyn(objInstance),
            new StaDyn(obj),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("let obj = {0: 1 + 2}", function() {
        let insns = compileMainSnippet("let obj = {0: 1 + 2}");
        let objInstance = new VReg();
        let lhs = new VReg();
        let elemIndex = new VReg();
        let obj = new VReg();
        let targetReg = new VReg();

        let expected = [
            new CreateObjectWithBuffer(new Imm(ResultType.Int, 0)),
            new StaDyn(objInstance),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new Add2Dyn(lhs),
            new StaDyn(targetReg),
            new LdaiDyn(new Imm(ResultType.Int, 0)),
            new StaDyn(elemIndex),
            new LdaDyn(targetReg),
            new StOwnByIndex(objInstance, elemIndex),
            new LdaDyn(objInstance),
            new StaDyn(obj),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("let obj = {\"str\": 1}", function() {
        let insns = compileMainSnippet("let obj = {\"str\": 1}");
        let objInstance = new VReg();
        let obj = new VReg();

        let expected = [
            new CreateObjectWithBuffer(new Imm(ResultType.Int, 0)),
            new StaDyn(objInstance),
            new LdaDyn(objInstance),
            new StaDyn(obj),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("let a; let obj = {a}", function() {
        let insns = compileMainSnippet("let a; let obj = {a}");
        let objInstance = new VReg();
        let obj = new VReg();
        let a = new VReg();

        let expected = [
            new CreateObjectWithBuffer(new Imm(ResultType.Int, 0)),
            new StaDyn(objInstance),
            new LdaDyn(a),
            new StOwnByName("a", objInstance),
            new LdaDyn(objInstance),
            new StaDyn(obj)
        ];
        insns = insns.slice(2, insns.length - 1);
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("duplicate __proto__", function() {
        let errorThrown = false;
        try {
            compileMainSnippet("({__proto__: null,other: null,'__proto__': null});");
        } catch (err) {
            expect(err.code).to.equal(DiagnosticCode.Duplicate_identifier_0);
            errorThrown = true;
        }
        expect(errorThrown).to.be.true;
    });
});

describe("Regular Expression", function() {
    it("let a = /abc/;", function() {
        let insns = compileMainSnippet("let a = /abc/;");
        insns = insns.slice(0, insns.length - 1);
        let ctorReg = new VReg();
        let regexpReg = new VReg();
        let regexpInstance = new VReg();
        let targetReg = new VReg();

        let expected = [
            new TryLdGlobalByName("RegExp"),
            new StaDyn(ctorReg),
            new MovDyn(targetReg, ctorReg),
            new LdaStr("abc"),
            new StaDyn(regexpReg),
            new NewObjDynRange(new Imm(ResultType.Int, 3), [ctorReg, targetReg, regexpReg]),
            new StaDyn(regexpInstance),
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("let a = /abc/i;", function() {
        let insns = compileMainSnippet("let a = /abc/i;");
        insns = insns.slice(0, insns.length - 1);
        let ctorReg = new VReg();
        let patternReg = new VReg();
        let flagsReg = new VReg();
        let regexpInstance = new VReg();
        let targetReg = new VReg();

        let expected = [
            new TryLdGlobalByName("RegExp"),
            new StaDyn(ctorReg),
            new MovDyn(targetReg, ctorReg),
            new LdaStr("abc"),
            new StaDyn(patternReg),
            new LdaStr("i"),
            new StaDyn(flagsReg),
            new NewObjDynRange(new Imm(ResultType.Int, 4), [ctorReg, targetReg, patternReg, flagsReg]),
            new StaDyn(regexpInstance),
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("let a = /abc;", function() {
        let errorThrown = false;
        try {
            let insns = compileMainSnippet("let a = /abc;");
        } catch (err) {
            expect(err.message).to.equal("Invalid regular expression: /abc;: Unterminated regular expression");
            errorThrown = true;
        }
        expect(errorThrown).to.be.true;
    });
});
