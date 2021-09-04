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
    Call1Dyn,
    DecDyn,
    DelObjProp,
    EqDyn,
    Imm,
    IncDyn,
    Jeqz,
    Jmp,
    Label,
    LdaDyn,
    LdaiDyn,
    LdaStr,
    LdObjByName,
    NegDyn,
    NotDyn,
    ResultType,
    ReturnUndefined,
    StaDyn,
    Toboolean,
    Tonumber,
    TryLdGlobalByName,
    TypeOfDyn,
    VReg
} from "../src/irnodes";
import { checkInstructions, compileMainSnippet, SnippetCompiler } from "./utils/base";

describe("UnaryOperationsTest", function() {
    describe("PrefixOperationsTest", function() {
        it('let i = 5; ++i', function() {
            let insns = compileMainSnippet("let i = 5; let j = ++i");

            let i = new VReg();
            let j = new VReg();
            let temp = new VReg();

            let expected = [
                new LdaiDyn(new Imm(ResultType.Int, 5)),
                new StaDyn(i),
                new LdaDyn(i),
                new StaDyn(temp),
                new IncDyn(temp),
                new StaDyn(i),
                new StaDyn(j),
                new ReturnUndefined()
            ];

            expect(checkInstructions(insns, expected)).to.be.true;
        });

        it('let i = 5; --i', function() {
            let insns = compileMainSnippet("let i = 5; let j = --i");

            let i = new VReg();
            let j = new VReg();
            let temp = new VReg();

            let expected = [
                new LdaiDyn(new Imm(ResultType.Int, 5)),
                new StaDyn(i),
                new LdaDyn(i),
                new StaDyn(temp),
                new DecDyn(temp),
                new StaDyn(i),
                new StaDyn(j),
                new ReturnUndefined()
            ];

            expect(checkInstructions(insns, expected)).to.be.true;
        });

        it('let i = 5; let j = +i', function() {
            let insns = compileMainSnippet("let i = 5; let j = +i");

            let i = new VReg();
            let j = new VReg();
            let temp = new VReg();

            let expected = [
                new LdaiDyn(new Imm(ResultType.Int, 5)),
                new StaDyn(i),
                new LdaDyn(i),
                new StaDyn(temp),
                new Tonumber(temp),
                new StaDyn(j),
                new ReturnUndefined()
            ];

            expect(checkInstructions(insns, expected)).to.be.true;
        });

        it('let i = 5; let j = -i', function() {
            let insns = compileMainSnippet("let i = 5; let j = -i");

            let i = new VReg();
            let j = new VReg();
            let temp = new VReg();

            let expected = [
                new LdaiDyn(new Imm(ResultType.Int, 5)),
                new StaDyn(i),
                new LdaDyn(i),
                new StaDyn(temp),
                new NegDyn(temp),
                new StaDyn(j),
                new ReturnUndefined()
            ];

            expect(checkInstructions(insns, expected)).to.be.true;
        });

        it('let i = 5; let j = !i', function() {
            let insns = compileMainSnippet("let i = 5; let j = !i");

            let i = new VReg();
            let j = new VReg();
            let trueReg = new VReg();
            let preLabel = new Label();
            let postLabel = new Label();
            let expected = [
                new LdaiDyn(new Imm(ResultType.Int, 5)),
                new StaDyn(i),
                new LdaDyn(i),
                new StaDyn(new VReg()),
                new Toboolean(),
                new EqDyn(trueReg),
                new Jeqz(preLabel),
                new LdaDyn(new VReg()),
                new Jmp(postLabel),
                preLabel,
                new LdaDyn(new VReg()),
                postLabel,
                new StaDyn(j),
                new ReturnUndefined()
            ];
            expect(checkInstructions(insns, expected)).to.be.true;
        });

        it('let i = 5; let j = ~i', function() {
            let insns = compileMainSnippet("let i = 5; let j = ~i");

            let i = new VReg();
            let j = new VReg();
            let temp_i = new VReg();

            let expected = [
                new LdaiDyn(new Imm(ResultType.Int, 5)),
                new StaDyn(i),
                new LdaDyn(i),
                new StaDyn(temp_i),
                new NotDyn(temp_i),
                new StaDyn(j),
                new ReturnUndefined()
            ];

            expect(checkInstructions(insns, expected)).to.be.true;
        });
    });

    describe("PostfixOperationsTest", function() {
        it("let i = 0; i++", function() {
            let insns = compileMainSnippet("let i = 5; i++");
            let i = new VReg();
            let temp = new VReg();
            let expected = [
                new LdaiDyn(new Imm(ResultType.Int, 5)),
                new StaDyn(i),
                new LdaDyn(i),
                new StaDyn(temp),
                new IncDyn(temp),
                new StaDyn(i),
                new Tonumber(i),
                new ReturnUndefined()
            ];
            expect(checkInstructions(insns, expected)).to.be.true;
        });

        it("let i = 0; i--", function() {
            let insns = compileMainSnippet("let i = 5; i--");
            let i = new VReg();
            let temp = new VReg();
            let expected = [
                new LdaiDyn(new Imm(ResultType.Int, 5)),
                new StaDyn(i),
                new LdaDyn(i),
                new StaDyn(temp),
                new DecDyn(temp),
                new StaDyn(i),
                new Tonumber(i),
                new ReturnUndefined()
            ];
            expect(checkInstructions(insns, expected)).to.be.true;
        });
    });

    describe("TypeOfTest", function() {
        it("typeof 12", function() {
            let insns = compileMainSnippet("typeof 5");
            let expected = [
                new LdaiDyn(new Imm(ResultType.Int, 5)),
                new TypeOfDyn(),
                new ReturnUndefined()
            ];

            expect(checkInstructions(insns, expected)).to.be.true;
        });

        it("typeof Number(\"12\")", function() {
            let insns = compileMainSnippet("typeof Number(\"5\")");
            let arg1 = new VReg();
            let arg3 = new VReg();
            let expected = [
                new TryLdGlobalByName("Number"),
                new StaDyn(arg1),

                new LdaStr("5"),
                new StaDyn(arg3),
                new Call1Dyn(arg1, arg3),
                new TypeOfDyn(),
                new ReturnUndefined()
            ];

            expect(checkInstructions(insns, expected)).to.be.true;
        });

        it("typeof x", function() {
            let insns = compileMainSnippet("typeof x");

            let expected = [
                new LdObjByName("x", new VReg()),
                new TypeOfDyn(),
                new ReturnUndefined()
            ];

            expect(checkInstructions(insns, expected)).to.be.true;
        });

        it("typeof(x)", function() {
            let insns = compileMainSnippet("typeof(x)");

            let expected = [
                new LdObjByName("x", new VReg()),
                new TypeOfDyn(),
                new ReturnUndefined()
            ];

            expect(checkInstructions(insns, expected)).to.be.true;
        });
    });

    describe("voidExpressionTest", function() {
        it("void (a)", function() {
            let insns = compileMainSnippet("let a; void (a);");
            let a = new VReg();
            let expected = [
                new LdaDyn(new VReg()),
                new StaDyn(a),
                new LdaDyn(a),
                new LdaDyn(new VReg()),
                new ReturnUndefined()
            ];
            expect(checkInstructions(insns, expected)).to.be.true;
        });
    });

    describe("deleteExpressionTest", function() {
        it("deleteElementFromArray", function() {
            let insns = compileMainSnippet("let arr = [1, 2]; delete arr[1];");
            let arrayReg = new VReg();
            let objReg = new VReg();
            let propReg = new VReg();

            let expected = [
                new LdaDyn(arrayReg),
                new StaDyn(objReg),
                new LdaiDyn(new Imm(ResultType.Int, 1)),
                new StaDyn(propReg),
                new DelObjProp(objReg, propReg),
                new ReturnUndefined()
            ];

            insns = insns.slice(insns.length - 6, insns.length);
            expect(checkInstructions(insns, expected)).to.be.true;
        });

        it("deletePropFromObj", function() {
            // this Snippet code isn't supported by TS
            let insns = compileMainSnippet(`let obj = {
                                  a: 1,
                                  b: 2};
                                  delete obj.b;`);
            let localObj = new VReg();
            let objReg = new VReg();
            let propReg = new VReg();

            let expected = [
                // delete obj.b;
                new LdaDyn(localObj),
                new StaDyn(objReg),
                new LdaStr("b"),
                new StaDyn(propReg),
                new DelObjProp(objReg, propReg),
                new ReturnUndefined()
            ];

            insns = insns.slice(insns.length - 6, insns.length);
            expect(checkInstructions(insns, expected)).to.be.true;
        });

        // delete function call won't use delObjProp
        it("deleteFunctionCall", function() {
            let snippetCompiler = new SnippetCompiler();
            snippetCompiler.compile(`var foo = function() {
                                  bIsFooCalled = true;
                              };
                              let a = delete foo();`);

            let insns = snippetCompiler.getGlobalInsns();
            let a = new VReg();
            let expected = [
                // function call insns
                new LdaDyn(new VReg()),
                new StaDyn(a),
                new ReturnUndefined()
            ];

            insns = insns.slice(insns.length - 3, insns.length);
            expect(checkInstructions(insns, expected)).to.be.true;
        });

        // delete keywords won't use delObjProp
        it("deleteKeywords", function() {
            let insns = compileMainSnippet(`let a = delete false;`);
            let a = new VReg();

            let expected = [
                new LdaDyn(new VReg()),
                new LdaDyn(new VReg()),
                new StaDyn(a),
                new ReturnUndefined()
            ];

            expect(checkInstructions(insns, expected)).to.be.true;
        });

        it("deleteUnresolvable", function() {
            let insns = compileMainSnippet(`delete a;`);
            let globalReg = new VReg();
            let a = new VReg();

            let expected = [
                new LdaStr("a"),
                new StaDyn(a),
                new DelObjProp(globalReg, a),
                new ReturnUndefined()
            ];

            expect(checkInstructions(insns, expected)).to.be.true;
        });

        it("double delete", function() {
            let insns = compileMainSnippet(`delete delete a;`);
            let globalReg = new VReg();
            let a = new VReg();

            let expected = [
                new LdaStr("a"),
                new StaDyn(a),
                new DelObjProp(globalReg, a),
                new LdaDyn(new VReg()),
                new ReturnUndefined()
            ];

            expect(checkInstructions(insns, expected)).to.be.true;
        });
    });
});
