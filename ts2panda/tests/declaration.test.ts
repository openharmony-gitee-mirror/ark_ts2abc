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
    CopyRestArgs,
    DefinefuncDyn,
    Imm,
    Jeqz,
    Label,
    LdaDyn,
    LdaiDyn,
    ResultType,
    ReturnUndefined,
    StaDyn,
    StGlobalVar,
    StrictEqDyn,
    VReg
} from "../src/irnodes";
import {
    FunctionScope,
    GlobalScope
} from "../src/scope";
import {
    GlobalVariable,
    LocalVariable
} from "../src/variable";
import { checkInstructions, compileAllSnippet, SnippetCompiler } from "./utils/base";
import { DiagnosticCode } from '../src/diagnostic';

describe("DeclarationTest", function() {

    it('var i in the global scope', function() {
        let snippetCompiler = new SnippetCompiler();

        snippetCompiler.compile("var i;");
        let globalScope = <GlobalScope>snippetCompiler.getGlobalScope();
        let insns = snippetCompiler.getGlobalInsns();

        let expected = [
            new LdaDyn(new VReg()),
            new StGlobalVar("i"),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
        let v = globalScope.findLocal("i");
        expect(v instanceof GlobalVariable).to.be.true;
    });

    it('let i in the global scope', function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile("let i;");
        let globalScope = <GlobalScope>snippetCompiler.getGlobalScope();
        let insns = snippetCompiler.getGlobalInsns();
        let expected = [
            new LdaDyn(new VReg()),
            new StaDyn(new VReg()),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
        let v = globalScope.findLocal("i");
        expect(v instanceof LocalVariable).to.be.true;
    });

    it('const i in the global scope', function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile("const i = 5;");
        let globalScope = <GlobalScope>snippetCompiler.getGlobalScope();
        let insns = snippetCompiler.getGlobalInsns();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StaDyn(new VReg()),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
        let v = globalScope.findLocal("i");
        expect(v instanceof LocalVariable).to.be.true;
    });

    it('var i = 5 in the global scope', function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile("var i = 5;");
        let globalScope = <GlobalScope>snippetCompiler.getGlobalScope();
        let insns = snippetCompiler.getGlobalInsns();
        let expected = [
            new LdaDyn(new VReg()),
            new StGlobalVar("i"),
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StGlobalVar("i"),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
        let v = globalScope.findLocal("i");
        expect(v instanceof GlobalVariable).to.be.true;
    });

    it('let i = 5 in the global scope', function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile("let i = 5;");
        let globalScope = <GlobalScope>snippetCompiler.getGlobalScope();
        let insns = snippetCompiler.getGlobalInsns();
        let i = new VReg();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StaDyn(i),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
        let v = globalScope.findLocal("i");
        expect(v instanceof LocalVariable).to.be.true;
    });

    it('var i, j in the global scope', function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile("var i, j;");
        let globalScope = <GlobalScope>snippetCompiler.getGlobalScope();
        let i = globalScope.findLocal("i");
        expect(i instanceof GlobalVariable).to.be.true;
        let j = globalScope.findLocal("j");
        expect(j instanceof GlobalVariable).to.be.true;
    });

    it('let i, j in the global scope', function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile("let i, j;");
        let globalScope = <GlobalScope>snippetCompiler.getGlobalScope();
        let i = globalScope.findLocal("i");
        expect(i instanceof LocalVariable).to.be.true;
        let j = globalScope.findLocal("j");
        expect(j instanceof LocalVariable).to.be.true;
    });

    it('const i, j in the global scope', function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile("const i=5, j=5;");
        let globalScope = <GlobalScope>snippetCompiler.getGlobalScope();
        let i = globalScope.findLocal("i");
        expect(i instanceof LocalVariable).to.be.true;
        let j = globalScope.findLocal("j");
        expect(j instanceof LocalVariable).to.be.true;
    });

    it('var i in a function scope', function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile("function a() {var i;}");
        let funcPg = snippetCompiler.getPandaGenByName("func_a_1");
        let functionScope = <FunctionScope>funcPg!.getScope();
        let insns = funcPg!.getInsns();
        let builtInUndefinedReg = new VReg();
        let v = new VReg();
        let expected = [
            new LdaDyn(builtInUndefinedReg),
            new StaDyn(v),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
        let i = functionScope.findLocal("i");
        expect(i).to.not.be.equal(undefined);
        expect(i instanceof LocalVariable).to.be.true;
    });

    it('let i in a function scope', function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile("function a() {let i;}");
        let funcPg = snippetCompiler.getPandaGenByName("func_a_1");
        let functionScope = <FunctionScope>funcPg!.getScope();
        let insns = funcPg!.getInsns();
        let expected = [
            new LdaDyn(new VReg()),
            new StaDyn(new VReg()),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
        let i = functionScope.findLocal("i");
        expect(i).to.be.equal(undefined);
    });

    it('const i in a function scope', function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile("function a() {const i = 5;}");
        let funcPg = snippetCompiler.getPandaGenByName("func_a_1");
        let functionScope = <FunctionScope>funcPg!.getScope();
        let insns = funcPg!.getInsns();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StaDyn(new VReg()),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
        let i = functionScope.findLocal("i");
        expect(i).to.be.equal(undefined);
    });

    it('let i in a local scope', function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile("{let i;}");
        let funcPg = snippetCompiler.getPandaGenByName("func_main_0");
        let localScope = funcPg!.getScope();
        let insns = funcPg!.getInsns();

        let expected = [
            new LdaDyn(new VReg()),
            new StaDyn(new VReg()),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
        let i = localScope!.findLocal("i");
        expect(i).to.be.equal(undefined);
    });

    it('let declaration syntax error', function() {
        let errorThrown = false;
        let snippetCompiler = new SnippetCompiler();
        try {
            snippetCompiler.compile("label: let i = 5;");
        } catch (err) {
            expect(err.code).to.equal(DiagnosticCode.Lexical_declaration_let_not_allowed_in_statement_position);
            errorThrown = true;
        }
        expect(errorThrown).to.be.true;
    });

    it('const i in a local scope', function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile("{const i = 5;}");
        let insns = snippetCompiler.getGlobalInsns();
        let scope = snippetCompiler.getGlobalScope();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StaDyn(new VReg()),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
        let i = scope!.findLocal("i");
        expect(i == undefined).to.be.true; // not in global
    });

    it('function definition in the global scope', function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile("function foo() {}");
        let funcName = "foo";
        let internalName = "func_foo_1";
        let expected = [
            new DefinefuncDyn(internalName, new VReg()),
            new StGlobalVar(funcName),
            new ReturnUndefined()
        ];
        let insns = snippetCompiler.getGlobalInsns();
        let globalScope = snippetCompiler.getGlobalScope();
        expect(checkInstructions(insns, expected)).to.be.true;
        let foo = globalScope!.findLocal("foo");
        expect(foo != undefined).to.be.true;
        expect(foo instanceof GlobalVariable).to.be.true;
    });

    it('function redefinition in the global scope', function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile(`
      function foo() {}
      function foo() {}
      `);
        let expected = [
            new DefinefuncDyn("func_foo_2", new VReg()),
            new StGlobalVar("foo"),
            new ReturnUndefined()
        ];
        let insns = snippetCompiler.getGlobalInsns();
        let globalScope = snippetCompiler.getGlobalScope();
        expect(checkInstructions(insns, expected)).to.be.true;
        let foo = globalScope!.findLocal("foo");
        expect(foo != undefined).to.be.true;
        expect(foo instanceof GlobalVariable).to.be.true;
    });

    it('function definition inside a function', function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile(`function out() {function foo() {}}`);
        let funcReg = new VReg();
        let expected = [
            new DefinefuncDyn("func_foo_2", new VReg()),
            new StaDyn(funcReg),

            new ReturnUndefined()
        ];
        let functionPg = snippetCompiler.getPandaGenByName("func_out_1");
        let insns = functionPg!.getInsns();
        let functionScope = functionPg!.getScope();

        expect(checkInstructions(insns!, expected)).to.be.true;
        let foo = functionScope!.findLocal("foo");
        expect(foo != undefined).to.be.true;
        expect(foo instanceof LocalVariable).to.be.true;
        let parameterLength = functionPg!.getParameterLength();
        expect(parameterLength == 0).to.be.true;
    });

    it("function expression", function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile("let foo = function() {}");
        let insns = snippetCompiler.getGlobalInsns();
        let func = new VReg();
        let expected = [
            new DefinefuncDyn("func_foo_1", new VReg()),
            new StaDyn(func),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("Parameters with initializer", function() {
        let compilerunit = compileAllSnippet("function test(a, b = 1) {}");
        let undefinedVReg = new VReg();
        let value = new VReg();
        let endLabel = new Label();

        let expected_main = [
            new DefinefuncDyn("func_test_1", new VReg()),
            new StGlobalVar("test"),
            new ReturnUndefined()
        ];
        let expected_func = [
            // func_test_0
            new LdaDyn(new VReg()),
            new StrictEqDyn(undefinedVReg),
            new Jeqz(endLabel),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StaDyn(value),
            endLabel,
            new ReturnUndefined(),
        ];

        compilerunit.forEach(element => {
            if (element.internalName == "func_main_0") {
                let insns = element.getInsns();
                expect(checkInstructions(insns, expected_main)).to.be.true;
            } else if (element.internalName == "func_test_1") {
                let insns = element.getInsns();
                expect(checkInstructions(insns, expected_func)).to.be.true;
                let parameterLength = element.getParameterLength();
                expect(parameterLength == 1).to.be.true;
            }
        });
    });

    it("Rest Parameters", function() {
        let snippetCompiler = new SnippetCompiler();
        snippetCompiler.compile(`function test(a, ...b) {}`);

        let idx = new Imm(ResultType.Int, 1);
        let lastParam = new VReg();
        let expected_func = [
            // func_test_0
            new CopyRestArgs(idx),
            new StaDyn(lastParam),
            new ReturnUndefined(),
        ];

        let functionPg = snippetCompiler.getPandaGenByName("func_test_1");
        let insns = functionPg!.getInsns();

        expect(checkInstructions(insns, expected_func)).to.be.true;
    });
});
