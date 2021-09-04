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

import { expect } from 'chai';
import { DiagnosticCode } from '../../src/diagnostic';
import {
    Add2Dyn,
    AsyncFunctionAwaitUncaughtDyn,
    AsyncFunctionEnterDyn,
    AsyncFunctionRejectDyn,
    AsyncFunctionResolveDyn,
    Call0Dyn,
    CreateGeneratorObjDyn,
    CreateIterResultObjectDyn,
    DefineAsyncFuncDyn,
    DefinefuncDyn,
    DefineGeneratorfuncDyn,
    DefineNCFuncDyn,
    EqDyn,
    GetResumeModeDyn,
    Imm,
    Jeqz,
    Label,
    LdaDyn,
    LdaiDyn,
    LdLexEnv,
    ResultType,
    ResumeGeneratorDyn,
    ReturnDyn,
    ReturnUndefined,
    StaDyn,
    SuspendGeneratorDyn,
    ThrowDyn,
    VReg
} from "../../src/irnodes";
import { CacheExpander } from '../../src/pass/cacheExpander';
import { checkInstructions, compileAllSnippet } from "../utils/base";

describe("compileFunctionExpression", function() {
    it("FunctionExpression with name", function() {
        let source: string = `
        var a = function test() {
            test();
        }`;

        let passes = [new CacheExpander()];
        let pandaGens = compileAllSnippet(source, passes);

        let expected_func = [
            new LdLexEnv(),
            new StaDyn(new VReg()),
            new LdaDyn(new VReg()),
            new StaDyn(new VReg()),
            new Call0Dyn(new VReg()),
            new ReturnUndefined()
        ];

        let checkCount = 0;
        pandaGens.forEach((pg) => {
            if (pg.internalName == "func_test_1") {
                expect(checkInstructions(pg.getInsns(), expected_func), "check func insns").to.be.true;
                checkCount++;
            }
        });

        expect(checkCount).to.equals(1);
    });

    it("FunctionExpression without name", function() {
        let source: string = `
        var a = function () {
        }`;

        let pandaGens = compileAllSnippet(source);

        let checkCount = 0;
        pandaGens.forEach((pg) => {
            if (pg.internalName == "func_a_1") {
                checkCount++;
            }

            if (pg.internalName == "func_main_0") {

                pg.getInsns().forEach((insns) => {
                    if (insns instanceof DefinefuncDyn) {
                        expect(insns.operands[0]).to.equal('func_a_1');
                        checkCount++;
                    }
                });
            }
        });

        expect(checkCount).to.equals(2);
    });

    it("FunctionExpression without name in binary expression", function() {
        let source: string = `
        var a;
        a = function () {
        }`;

        let pandaGens = compileAllSnippet(source);

        let checkCount = 0;
        pandaGens.forEach((pg) => {
            if (pg.internalName == "func_a_1") {
                checkCount++;
            }

            if (pg.internalName == "func_main_0") {

                pg.getInsns().forEach((insns) => {
                    if (insns instanceof DefinefuncDyn) {
                        expect(insns.operands[0]).to.equal('func_a_1');
                        checkCount++;
                    }
                });
            }
        });

        expect(checkCount).to.equals(2);
    });


    it("ArrowFunction", function() {
        let source: string = `
        var a = ()=> {
        }`;

        let pandaGens = compileAllSnippet(source);
        let checkCount = 0;

        pandaGens.forEach((pg) => {
            if (pg.internalName == "func_a_1") {
                checkCount++;
            }

            if (pg.internalName == "func_main_0") {

                pg.getInsns().forEach((insns) => {
                    if (insns instanceof DefineNCFuncDyn) {
                        expect(insns.operands[0]).to.equal('func_a_1');
                        checkCount++;
                    }
                });
            }
        });

        expect(checkCount).to.equals(2);
    });

    it("ArrowFunctionWithExpression", function() {
        let source: string = `
        var p = (x, y) => x + y;`;

        let pandaGens = compileAllSnippet(source);
        let checkCount = 0;

        let expected_func = [
            new LdaDyn(new VReg()),
            new StaDyn(new VReg()),
            new LdaDyn(new VReg()),
            new Add2Dyn(new VReg()),
            new StaDyn(new VReg()),
            new LdaDyn(new VReg()),
            new ReturnDyn()
        ];

        pandaGens.forEach((pg) => {
            if (pg.internalName == "func_p_1") {
                expect(checkInstructions(pg.getInsns(), expected_func), "check arrow func insns").to.be.true;
                checkCount++;
            }

            if (pg.internalName == "func_main_0") {

                pg.getInsns().forEach((insns) => {
                    if (insns instanceof DefineNCFuncDyn) {
                        expect(insns.operands[0]).to.equal('func_p_1');
                        checkCount++;
                    }
                });
            }
        });

        expect(checkCount).to.equals(2);
    });

    it("ArrowFunctionSyntaxError", function() {
        let source: string = `
            var af = x
                => {};`;
        let errorThrown = false;
        try {
            compileAllSnippet(source);
        } catch (err) {
            expect(err.code).to.equal(DiagnosticCode.Line_terminator_not_permitted_before_arrow);
            errorThrown = true;
        }
        expect(errorThrown).to.be.true;
    });

    it("GeneratorFunction", function() {
        let source: string = `
            function* a() {
                yield 1;
            }`;

        let notRetLabel0 = new Label();
        let notThrowLabel0 = new Label();
        let notRetLabel1 = new Label();
        let notThrowLabel1 = new Label();

        let expected_func = [
            new CreateGeneratorObjDyn(new VReg()),
            new StaDyn(new VReg()),
            new SuspendGeneratorDyn(new VReg(), new VReg()),
            new ResumeGeneratorDyn(new VReg()),
            new StaDyn(new VReg()),
            new GetResumeModeDyn(new VReg()),
            new StaDyn(new VReg()),

            new LdaiDyn(new Imm(ResultType.Int, 0)),
            new EqDyn(new VReg()),
            new Jeqz(notRetLabel0),
            new LdaDyn(new VReg()),
            new ReturnDyn(),

            notRetLabel0,
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new EqDyn(new VReg()),
            new Jeqz(notThrowLabel0),
            new LdaDyn(new VReg()),
            new ThrowDyn(),

            notThrowLabel0,
            new LdaDyn(new VReg()),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StaDyn(new VReg()),
            new CreateIterResultObjectDyn(new VReg(), new VReg()),
            new StaDyn(new VReg()),
            new SuspendGeneratorDyn(new VReg(), new VReg()),
            new ResumeGeneratorDyn(new VReg()),
            new StaDyn(new VReg()),
            new GetResumeModeDyn(new VReg()),
            new StaDyn(new VReg()),

            new LdaiDyn(new Imm(ResultType.Int, 0)),
            new EqDyn(new VReg()),
            new Jeqz(notRetLabel1),
            new LdaDyn(new VReg()),
            new ReturnDyn(),

            notRetLabel1,
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new EqDyn(new VReg()),
            new Jeqz(notThrowLabel1),
            new LdaDyn(new VReg()),
            new ThrowDyn(),

            notThrowLabel1,
            new LdaDyn(new VReg()),
            new ReturnUndefined()
        ];

        let pandaGens = compileAllSnippet(source);
        let checkCount = 0;

        pandaGens.forEach((pg) => {
            if (pg.internalName == "func_a_1") {
                expect(checkInstructions(pg.getInsns(), expected_func), "check generator func insns").to.be.true;
                checkCount++;
            }

            if (pg.internalName == "func_main_0") {
                pg.getInsns().forEach((insns) => {
                    if (insns instanceof DefineGeneratorfuncDyn) {
                        expect(insns.operands[0]).to.equal('func_a_1');
                        checkCount++;
                    }
                });
            }
        });

        expect(checkCount).to.equals(2);
    });

    it("AsyncFunction", function() {
        let source: string = `
            async function a() {
                await 1;
            }`;

        let beginLabel = new Label();
        let endLabel = new Label();
        let nextLabel = new Label();

        let expected_func = [
            new AsyncFunctionEnterDyn(),
            new StaDyn(new VReg()),
            beginLabel,
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StaDyn(new VReg()),
            new AsyncFunctionAwaitUncaughtDyn(new VReg(), new VReg()),
            new StaDyn(new VReg()),
            new SuspendGeneratorDyn(new VReg(), new VReg()),
            new ResumeGeneratorDyn(new VReg()),
            new StaDyn(new VReg()),
            new GetResumeModeDyn(new VReg()),
            new StaDyn(new VReg()),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new EqDyn(new VReg()),
            new Jeqz(nextLabel),
            new LdaDyn(new VReg()),
            new ThrowDyn(),
            nextLabel,
            new LdaDyn(new VReg()),
            new AsyncFunctionResolveDyn(new VReg(), new VReg(), new VReg()),
            new ReturnDyn(),
            endLabel,
            new StaDyn(new VReg()),
            new AsyncFunctionRejectDyn(new VReg(), new VReg(), new VReg()),
            new ReturnDyn(),
        ];

        let pandaGens = compileAllSnippet(source);
        let checkCount = 0;

        pandaGens.forEach((pg) => {
            if (pg.internalName == "func_a_1") {
                expect(checkInstructions(pg.getInsns(), expected_func), "check async func insns").to.be.true;
                checkCount++;
            }

            if (pg.internalName == "func_main_0") {
                pg.getInsns().forEach((insns) => {
                    if (insns instanceof DefineAsyncFuncDyn) {
                        expect(insns.operands[0]).to.equal('func_a_1');
                        checkCount++;
                    }
                });
            }
        });

        expect(checkCount).to.equals(2);
    });

    it("FunctionWithRestParameterSyntaxError", function() {
        let source: string = `function func(...a,)`;
        let errorThrown = false;
        try {
            compileAllSnippet(source);
        } catch (err) {
            expect(err.code).to.equal(DiagnosticCode.A_rest_parameter_or_binding_pattern_may_not_have_a_trailing_comma);
            errorThrown = true;
        }
        expect(errorThrown).to.be.true;
    });
})