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
    GetUnmappedArgs,
    Imm,
    LdaDyn,
    LdaiDyn,
    LdObjByIndex,
    ResultType,
    ReturnUndefined,
    StaDyn,
    VReg
} from "../src/irnodes";
import { PandaGen } from "../src/pandagen";
import { LocalVariable } from "../src/variable";
import { checkInstructions, compileMainSnippet, SnippetCompiler } from "./utils/base";

describe("ParenthesizedExpressionTest", function () {
    it("(a)", function () {
        let insns = compileMainSnippet("let a; (a);");
        let a = new VReg();
        let expected = [
            new LdaDyn(new VReg()),
            new StaDyn(a),
            new LdaDyn(a),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("(((a)))", function () {
        let insns = compileMainSnippet("let a; (((a)))");
        let a = new VReg();
        let expected = [
            new LdaDyn(new VReg()),
            new StaDyn(a),
            new LdaDyn(a),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });
});

describe("ThisKeyword", function () {
    let pandaGen: PandaGen;

    beforeEach(function () {
        pandaGen = new PandaGen("" /* internalName */, 0 /* number of parameters */);
    });

    it("this in global scope", function () {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile("this");
        let globalScope = snippetCompiler.getGlobalScope();
        let insns = snippetCompiler.getGlobalInsns();
        let expected = [
            new LdaDyn(new VReg()),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
        let thisVar = globalScope!.findLocal("this");
        expect(thisVar instanceof LocalVariable).to.be.true;
    });

    it("this in function scope", function () {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile("function a() {this}");
        let functionPg = snippetCompiler.getPandaGenByName("func_a_1");
        let functionScope = functionPg!.getScope();
        let insns = compileMainSnippet("this;", pandaGen, functionScope);
        let expected = [
            new LdaDyn(new VReg()),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
        let thisVar = functionScope!.findLocal("this");
        expect(thisVar != undefined).to.be.true;
        expect(thisVar instanceof LocalVariable).to.be.true;
    });
});

describe("arguments Keyword", function () {
    it('arguments: Array-like object accessible inside functions', function () {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile(`function foo(a,b) {arguments[0];}`);
        let argumentsReg = new VReg();
        let temp1 = new VReg();
        let indexReg = new VReg();
        let expected = [
            new GetUnmappedArgs(),
            new StaDyn(argumentsReg),
            new LdaDyn(argumentsReg),
            new StaDyn(temp1),
            new LdaiDyn(new Imm(ResultType.Int, 0)),
            new StaDyn(indexReg),
            new LdObjByIndex(temp1, indexReg),
            new ReturnUndefined()
        ];
        let functionPg = snippetCompiler.getPandaGenByName("func_foo_1");
        let insns = functionPg!.getInsns();

        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it('arguments as parameter shadows keyword', function () {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile(`function foo(arguments) {arguments[0];}`);
        let parameterArguments = new VReg();
        let temp1 = new VReg();
        let indexReg = new VReg();
        let expected = [
            new GetUnmappedArgs(),
            new StaDyn(new VReg()),
            new LdaDyn(parameterArguments),
            new StaDyn(temp1),
            new LdaiDyn(new Imm(ResultType.Int, 0)),
            new StaDyn(indexReg),
            new LdObjByIndex(temp1, indexReg),
            new ReturnUndefined()
        ];
        let functionPg = snippetCompiler.getPandaGenByName("func_foo_1");
        let insns = functionPg!.getInsns();

        expect(checkInstructions(insns, expected)).to.be.true;
    });
});
