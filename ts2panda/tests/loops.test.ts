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
    CalliThisRangeDyn,
    CreateEmptyArray,
    EqDyn,
    GetIterator,
    Imm,
    IncDyn,
    Jeqz,
    Jgez,
    Jmp,
    Label,
    LdaDyn,
    LdaiDyn,
    LdObjByName,
    LdTrue,
    LessDyn,
    ResultType,
    ReturnUndefined,
    StaDyn,
    StrictNotEqDyn,
    ThrowDyn,
    ThrowIfNotObject,
    Toboolean,
    Tonumber,
    VReg
} from "../src/irnodes";
import { checkInstructions, compileMainSnippet } from "./utils/base";
import { DiagnosticCode } from '../src/diagnostic';

describe("ForLoopTest", function() {
    it('forLoopEmpty', function() {
        let insns = compileMainSnippet("for (;;) {}");
        let labelPre = new Label();
        let labelPost = new Label();
        let labelIncr = new Label();
        let expected = [
            labelPre,
            labelIncr,
            new Jmp(labelPre),
            labelPost,
            new ReturnUndefined()
        ];
        let jumps = insns.filter(item => item instanceof Jmp);

        expect(jumps.length).to.equal(1);

        let jmpLabel = (<Jmp>jumps[0]).getTarget();

        expect(checkInstructions(insns, expected)).to.be.true;
        expect(jmpLabel).to.equal(insns[0]);
    });

    it('forLoopWithInitializer', function() {
        let insns = compileMainSnippet("for (let i = 0;;) {}");
        let jumps = insns.filter(item => item instanceof Jmp);

        expect(jumps.length).to.equal(1);

        let jmpLabel = (<Jmp>jumps[0]).getTarget();

        expect(insns[4]).to.equal(jumps[0]);
        expect(jmpLabel).to.equal(insns[2]);
    });

    it('forLoopWithInitializerAndCondition', function() {
        let insns = compileMainSnippet("for (let i = 0; i < 5;) {}");
        let jumps = insns.filter(item => (item instanceof Jmp || item instanceof Jeqz));

        expect(jumps.length).to.equal(2);

        let jgezLabel = (<Jmp>jumps[0]).getTarget();
        let jmpLabel = (<Jmp>jumps[1]).getTarget();

        expect(jmpLabel).to.equal(insns[2]);
        expect(jgezLabel).to.equal(insns[10]);

        expect(insns[7]).to.equal(jumps[0]);
        expect(insns[9]).to.equal(jumps[1]);
    });

    it('forLoopWithInitializerAndConditionAndIncrementor', function() {
        let insns = compileMainSnippet("for (let i = 0; i < 5; i++) {}");
        let jumps = insns.filter(item => (item instanceof Jmp || item instanceof Jeqz));

        expect(jumps.length).to.equal(2);

        let jgezLabel = (<Jmp>jumps[0]).getTarget();
        let jmpLabel = (<Jmp>jumps[1]).getTarget();

        expect(jmpLabel).to.equal(insns[2]);
        expect(jgezLabel).to.equal(insns[15]);

        expect(insns[7]).to.equal(jumps[0]);
        expect(insns[14]).to.equal(jumps[1]);
    });

    it('forLoopWithContinue', function() {
        let insns = compileMainSnippet("for (let i = 0; i < 5; ++i) { continue; }");
        let i = new VReg();
        let lhs = new VReg();
        let operand = new VReg();
        let labelPre = new Label();
        let labelPost = new Label();
        let labelIncr = new Label();
        let expected = [
            // initializer
            new LdaiDyn(new Imm(ResultType.Int, 0)),
            new StaDyn(i),
            labelPre,
            // condition
            new LdaDyn(i),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new LessDyn(lhs),
            new Jeqz(labelPost),
            // body
            new Jmp(labelIncr), // continue
            labelIncr,
            // incrementor
            new LdaDyn(i),
            new StaDyn(operand),
            new IncDyn(operand),
            new StaDyn(i),
            // jump to the loop header
            new Jmp(new Label()),
            labelPost,
            new ReturnUndefined()
        ];
        // check the instruction kinds are the same as we expect
        expect(checkInstructions(insns, expected)).to.be.true;
        // check continue jumps to the expected instruction
        let jmp = <Jmp>insns[8];
        let targetLabel = (jmp).getTarget();
        expect(targetLabel).to.equal(insns[9]);
    });

    it('forLoopWithBreak', function() {
        let insns = compileMainSnippet("for (let i = 0; i < 5; ++i) {break; }");
        let i = new VReg();
        let lhs = new VReg();
        let operand = new VReg();
        let labelPre = new Label();
        let labelPost = new Label();
        let labelIncr = new Label();
        let expected = [
            // initializer
            new LdaiDyn(new Imm(ResultType.Int, 0)),
            new StaDyn(i),
            labelPre,
            // condition
            new LdaDyn(i),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new LessDyn(lhs),
            new Jeqz(labelPost),
            // body
            new Jmp(labelPost), // break
            // incrementor
            labelIncr,
            new LdaDyn(i),
            new StaDyn(operand),
            new IncDyn(operand),
            new StaDyn(i),
            // jump to the loop header
            new Jmp(labelPre),
            labelPost,
            new ReturnUndefined()
        ];
        // check the instruction kinds are the same as we expect
        expect(checkInstructions(insns, expected)).to.be.true;
        // check continue jumps to the expected instruction
        let jmp = <Jmp>insns[8];
        let targetLabel = (jmp).getTarget();
        expect(targetLabel).to.equal(insns[15]);
    });
});

describe("ForOfLoopTest", function() {
    it("forOfLoopWithEmptyArray", function() {
        let insns = compileMainSnippet("for (let a of []) {}");
        let a = new VReg();
        let arrInstance = new VReg();
        let iterReg = new VReg();
        let nextMethodReg = new VReg();
        let resultObj = new VReg();
        let exceptionVreg = new VReg();
        let trueReg = new VReg();
        let done = new VReg();
        let value = new VReg();

        let loopStartLabel = new Label();
        let loopEndLabel = new Label();
        let tryBeginLabel = new Label();
        let tryEndLabel = new Label();
        let catchBeginLabel = new Label();
        let isDone = new Label();

        let expected = [
            new CreateEmptyArray(),
            new StaDyn(arrInstance),
            new GetIterator(),
            new StaDyn(iterReg),
            new LdObjByName("next", iterReg),
            new StaDyn(nextMethodReg),

            new LdaDyn(new VReg()),
            new StaDyn(done),

            tryBeginLabel,
            new LdaDyn(trueReg),
            new StaDyn(done),
            loopStartLabel,
            new CalliThisRangeDyn(new Imm(ResultType.Int, 1), [nextMethodReg, iterReg]),
            new StaDyn(resultObj),
            new ThrowIfNotObject(resultObj),
            new LdObjByName("done", resultObj),
            new Toboolean(),
            new StrictNotEqDyn(trueReg),
            new Jeqz(loopEndLabel),
            new LdObjByName("value", resultObj),
            new StaDyn(value),

            new LdaDyn(new VReg()),
            new StaDyn(done),

            new LdaDyn(value),
            new StaDyn(a),
            tryEndLabel,

            new Jmp(loopStartLabel),

            catchBeginLabel,
            new StaDyn(exceptionVreg),
            new LdaDyn(done),
            new StrictNotEqDyn(trueReg),
            new Jeqz(isDone),
            new LdObjByName("return", iterReg),
            new StaDyn(nextMethodReg),
            new StrictNotEqDyn(new VReg()),
            new Jeqz(isDone),
            new CalliThisRangeDyn(new Imm(ResultType.Int, 1), [nextMethodReg, iterReg]),
            isDone,
            new LdaDyn(exceptionVreg),
            new ThrowDyn(),

            loopEndLabel,
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;

        let jumps = insns.filter(item => (item instanceof Jmp || item instanceof Jeqz));

        expect(jumps.length).to.equal(4);
    });

    it("forOfLoopWithContinue", function() {
        let insns = compileMainSnippet("for (let a of []) {continue;}");
        let a = new VReg();
        let arrInstance = new VReg();
        let resultObj = new VReg();
        let trueReg = new VReg();
        let iterReg = new VReg();
        let exceptionVreg = new VReg();
        let nextMethodReg = new VReg();
        let done = new VReg();
        let value = new VReg();

        let loopStartLabel = new Label();
        let loopEndLabel = new Label();
        let tryBeginLabel = new Label();
        let tryEndLabel = new Label();
        let catchBeginLabel = new Label();
        let isDone = new Label();
        let insertedtryBeginLabel = new Label();
        let insertedtryEndLabel = new Label();

        let expected = [
            new CreateEmptyArray(),
            new StaDyn(arrInstance),
            new GetIterator(),
            new StaDyn(iterReg),
            new LdObjByName("next", iterReg),
            new StaDyn(nextMethodReg),

            new LdaDyn(new VReg()),
            new StaDyn(done),

            tryBeginLabel,
            new LdaDyn(trueReg),
            new StaDyn(done),
            loopStartLabel,
            new CalliThisRangeDyn(new Imm(ResultType.Int, 1), [nextMethodReg, iterReg]),
            new StaDyn(resultObj),
            new ThrowIfNotObject(resultObj),
            new LdObjByName("done", resultObj),
            new Toboolean(),
            new StrictNotEqDyn(trueReg),
            new Jeqz(loopEndLabel),
            new LdObjByName("value", resultObj),
            new StaDyn(value),

            new LdaDyn(new VReg()),
            new StaDyn(done),

            new LdaDyn(value),
            new StaDyn(a),

            insertedtryBeginLabel,
            insertedtryEndLabel,
            new Jmp(loopStartLabel),

            tryEndLabel,

            new Jmp(loopStartLabel),

            catchBeginLabel,
            new StaDyn(exceptionVreg),
            new LdaDyn(done),
            new StrictNotEqDyn(trueReg),
            new Jeqz(isDone),
            new LdObjByName("return", iterReg),
            new StaDyn(nextMethodReg),
            new StrictNotEqDyn(new VReg()),
            new Jeqz(isDone),
            new CalliThisRangeDyn(new Imm(ResultType.Int, 1), [nextMethodReg, iterReg]),
            isDone,
            new LdaDyn(exceptionVreg),
            new ThrowDyn(),

            loopEndLabel,
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;

        let jumps = insns.filter(item => (item instanceof Jmp || item instanceof Jeqz));

        expect(jumps.length).to.equal(5);
    });

    it("forOfLoopWithBreak", function() {
        let insns = compileMainSnippet("for (let a of []) {break;}");
        let a = new VReg();
        let arrInstance = new VReg();
        let resultObj = new VReg();
        let exceptionVreg = new VReg();
        let iterReg = new VReg();
        let trueReg = new VReg();
        let nextMethodReg = new VReg();
        let done = new VReg();
        let value = new VReg();
        let loopStartLabel = new Label();
        let loopEndLabel = new Label();
        let tryBeginLabel = new Label();
        let tryEndLabel = new Label();
        let catchBeginLabel = new Label();
        let isDone = new Label();
        let noReturn = new Label();
        let insertedtryBeginLabel = new Label();
        let insertedtryEndLabel = new Label();

        let expected = [
            new CreateEmptyArray(),
            new StaDyn(arrInstance),
            new GetIterator(),
            new StaDyn(iterReg),
            new LdObjByName("next", iterReg),
            new StaDyn(nextMethodReg),

            new LdaDyn(new VReg()),
            new StaDyn(done),

            tryBeginLabel,
            new LdaDyn(trueReg),
            new StaDyn(done),
            loopStartLabel,
            new CalliThisRangeDyn(new Imm(ResultType.Int, 1), [nextMethodReg, iterReg]),
            new StaDyn(resultObj),
            new ThrowIfNotObject(resultObj),
            new LdObjByName("done", resultObj),
            new Toboolean(),
            new StrictNotEqDyn(trueReg),
            new Jeqz(loopEndLabel),
            new LdObjByName("value", resultObj),
            new StaDyn(value),

            new LdaDyn(new VReg()),
            new StaDyn(done),

            new LdaDyn(value),
            new StaDyn(a),

            insertedtryBeginLabel,
            new LdObjByName("return", iterReg),
            new StaDyn(nextMethodReg),
            new StrictNotEqDyn(new VReg()), // undefined
            new Jeqz(noReturn),
            new CalliThisRangeDyn(new Imm(ResultType.Int, 1), [nextMethodReg, iterReg]),
            new StaDyn(new VReg()),
            new ThrowIfNotObject(new VReg()),
            noReturn,
            insertedtryEndLabel,
            new Jmp(loopEndLabel),

            tryEndLabel,

            new Jmp(loopStartLabel),

            catchBeginLabel,
            new StaDyn(exceptionVreg),
            new LdaDyn(done),
            new StrictNotEqDyn(trueReg),
            new Jeqz(isDone),
            new LdObjByName("return", iterReg),
            new StaDyn(nextMethodReg),
            new StrictNotEqDyn(new VReg()),
            new Jeqz(isDone),
            new CalliThisRangeDyn(new Imm(ResultType.Int, 1), [nextMethodReg, iterReg]),
            isDone,
            new LdaDyn(exceptionVreg),
            new ThrowDyn(),

            loopEndLabel,
            new ReturnUndefined()
        ];

        expect(checkInstructions(insns, expected)).to.be.true;

        let jumps = insns.filter(item => (item instanceof Jmp || item instanceof Jeqz));

        expect(jumps.length).to.equal(6);
    });

    it("ForIn SyntaxError", function() {
        let source: string = `for ([(x, y)] in {}) { }`;
        let errorThrown = false;
        try {
            compileMainSnippet(source);
        } catch (err) {
            expect(err.code).to.equal(DiagnosticCode.Property_destructuring_pattern_expected);
            errorThrown = true;
        }
        expect(errorThrown).to.be.true;
    });

    it("ForOf SyntaxError", function() {
        let source: string = `for ([(x, y)] of []) {}`;
        let errorThrown = false;
        try {
            compileMainSnippet(source);
        } catch (err) {
            expect(err.code).to.equal(DiagnosticCode.Property_destructuring_pattern_expected);
            errorThrown = true;
        }
        expect(errorThrown).to.be.true;
    });
});

describe("WhileLoopTest", function() {
    it("while (true) {}", function() {
        let insns = compileMainSnippet("while (true) {}");
        let labelPre = new Label();
        let labelPost = new Label();
        let trueReg = new VReg();
        let expected = [
            labelPre,
            new LdaDyn(new VReg()),
            new Toboolean(),
            new EqDyn(trueReg),
            new Jeqz(labelPost),
            new Jmp(labelPre),
            labelPost,
            new ReturnUndefined()
        ];

        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("while (a + b) {}", function() {
        let insns = compileMainSnippet("let a, b; while (a + b) {}");
        let loopBegin = new Label();
        let loopEnd = new Label();
        let a = new VReg();
        let b = new VReg();
        let lhs = new VReg();
        let trueReg = new VReg();
        let expected = [
            loopBegin,
            // a + b
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaDyn(b),
            new Add2Dyn(lhs),
            new Toboolean(),
            new EqDyn(trueReg),
            new Jeqz(loopEnd),
            // body
            new Jmp(loopBegin),
            loopEnd
        ];

        insns = insns.slice(4, insns.length - 1); // skip let a, b and return.dyn
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it('whileLoopWithBody', function() {
        let insns = compileMainSnippet(`
      let a;
      while (a < 0) { a = 1; }
      `);

        let a = new VReg();
        let lhs = new VReg();
        let loopBegin = new Label();
        let loopEnd = new Label();
        let expected = [
            loopBegin,
            // condition
            // compute lhs
            new LdaDyn(a),
            new StaDyn(lhs),
            // compute rhs
            new LdaiDyn(new Imm(ResultType.Int, 0)),
            new LessDyn(lhs),
            new Jeqz(loopEnd),

            // body
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StaDyn(a),
            new Jmp(loopBegin),

            loopEnd,
        ];

        insns = insns.slice(2, insns.length - 1); // skip let a and return.dyn
        expect(checkInstructions(insns, expected)).to.be.true;
        expect((<Jgez>insns[5]).getTarget() === insns[insns.length - 1]).to.be.true;
        expect((<Jmp>insns[insns.length - 2]).getTarget() === insns[0]).to.be.true;
    });

    it('whileLoopWithContinue', function() {
        let insns = compileMainSnippet("let a = 5;" +
            "while (a < 1) { a = 2; continue; }");
        let a = new VReg();
        let lhs = new VReg();
        let labelPre = new Label();
        let labelPost = new Label();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StaDyn(a),
            labelPre,
            // condition
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new LessDyn(lhs),
            new Jeqz(labelPost),
            //body
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(a),
            new Jmp(labelPre), // continue
            new Jmp(labelPre),
            labelPost,
            new ReturnUndefined()
        ]
        // check the instruction kinds are the same as we expect
        expect(checkInstructions(insns, expected)).to.be.true;
        // check continue jumps to the expected instruction
        let jmp = <Jmp>insns[11];
        let targetLabel = (jmp).getTarget();
        expect(targetLabel).to.equal(insns[2]);
    });

    it('whileLoopWithBreak', function() {
        let insns = compileMainSnippet("let a = 5;" +
            "while (a < 1) { a = 2; break; }");
        let a = new VReg();
        let lhs = new VReg();
        let labelPre = new Label();
        let labelPost = new Label();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StaDyn(a),
            labelPre,
            // condition
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new LessDyn(lhs),
            new Jeqz(labelPost),
            //body
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(a),
            new Jmp(labelPost), //break
            new Jmp(labelPre),
            labelPost,
            new ReturnUndefined()
        ]
        // check the instruction kinds are the same as we expect
        expect(checkInstructions(insns, expected)).to.be.true;
        // check continue jumps to the expected instruction
        let jmp = <Jmp>insns[10];
        let targetLabel = (jmp).getTarget();
        expect(targetLabel).to.equal(insns[12]);
    });
});

describe("DoWhileLoopTest", function() {
    it('doWhileLoopEmpty', function() {
        let insns = compileMainSnippet("do {} while (true)");

        let jumps = insns.filter(item => item instanceof Jmp);

        expect(jumps.length).to.equal(1);

        let jmpLabel = (<Jmp>jumps[0]).getTarget();

        expect(jmpLabel).to.equal(insns[0]);
    });

    it('doWhileLoopWithBody', function() {
        let insns = compileMainSnippet("let a = 5;" +
            "do { a++ } while (a < 11);");

        let jumps = insns.filter(item => (item instanceof Jmp || item instanceof Jeqz));

        expect(jumps.length).to.equal(2);

        let jgezLabel = (<Jmp>jumps[0]).getTarget();
        let jmpLabel = (<Jmp>jumps[1]).getTarget();

        expect(jmpLabel).to.equal(insns[2]);
        expect(jgezLabel).to.equal(insns[15]);

        expect(insns[13]).to.equal(jumps[0]);
        expect(insns[14]).to.equal(jumps[1]);
    });

    it('doWhileLoopWithContinue', function() {
        let insns = compileMainSnippet("let a = 5;" +
            "do { a = 1; continue; } while (a < 1);");
        let a = new VReg();
        let lhs = new VReg();
        let labelPre = new Label();
        let labelCond = new Label();
        let labelPost = new Label();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StaDyn(a),
            // body
            labelPre,
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StaDyn(a),
            new Jmp(labelCond), // continue
            // condition
            labelCond,
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new LessDyn(lhs),
            new Jeqz(labelPost),
            new Jmp(labelPre),
            labelPost,
            new ReturnUndefined()
        ]
        // check the instruction kinds are the same as we expect
        expect(checkInstructions(insns, expected)).to.be.true;
        // check continue jumps to the expected instruction
        let jmp = <Jmp>insns[5];
        let targetLabel = (jmp).getTarget();
        expect(targetLabel).to.equal(insns[6]);
    });

    it('doWhileLoopWithBreak', function() {
        let insns = compileMainSnippet("let a = 5;" +
            "do { a = 1; break; } while (a < 1);");
        let a = new VReg();
        let lhs = new VReg();
        let labelPre = new Label();
        let labelPost = new Label();
        let labelCond = new Label();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StaDyn(a),
            //body
            labelPre,
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StaDyn(a),
            new Jmp(labelPost), // break
            // condition
            labelCond,
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new LessDyn(lhs),
            new Jeqz(labelPost),
            new Jmp(labelPre),
            labelPost,
            new ReturnUndefined()
        ]
        // check the instruction kinds are the same as we expect
        expect(checkInstructions(insns, expected)).to.be.true;
        // check continue jumps to the expected instruction
        let jmp = <Jmp>insns[5];
        let targetLabel = (jmp).getTarget();
        expect(targetLabel).to.equal(insns[13]);
    });
});

describe("LoopWithLabelTests", function() {
    it('forLoopWithBreakWithLabel', function() {
        let insns = compileMainSnippet(`loop1:
                                for (let i = 0; i < 5; ++i) {
                                    for (let j = 0; j < 6; j++) {
                                        break loop1;
                                    }
                                }`);
        let i = new VReg();
        let j = new VReg();
        let lhs = new VReg();
        let labelPre = new Label();
        let labelPost = new Label();
        let labelIncr = new Label();
        let labelPre1 = new Label();
        let labelPost1 = new Label();
        let labelIncr1 = new Label();
        let expected = [
            // initializer
            new LdaiDyn(new Imm(ResultType.Int, 0.0)),
            new StaDyn(i),
            labelPre,
            // condition
            new LdaDyn(i),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 5.0)),
            new LessDyn(lhs),
            new Jeqz(labelPost),

            // second for
            new LdaiDyn(new Imm(ResultType.Int, 0.0)),
            new StaDyn(j),
            labelPre1,
            // condition
            new LdaDyn(j),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 6.0)),
            new LessDyn(lhs),
            new Jeqz(labelPost1),
            new Jmp(labelPost),
            labelIncr1,
            // incrementor
            new LdaDyn(j),
            new StaDyn(j),
            new IncDyn(j),
            new StaDyn(j),
            new Tonumber(j),
            // jump to the loop header
            new Jmp(labelPre1),
            labelPost1,
            labelIncr,
            // incrementor
            new LdaDyn(i),
            new StaDyn(i),
            new IncDyn(i),
            new StaDyn(i),
            // jump to the loop header
            new Jmp(labelPre),
            labelPost,
            new ReturnUndefined()
        ];

        // check the instruction kinds are the same as we expect
        expect(checkInstructions(insns, expected)).to.be.true;
        // check break jumps to the expected instruction
        let jmp = <Jmp>insns[16];
        let targetLabel = (jmp).getTarget();
        expect(targetLabel).to.equal(insns[31]);
    });

    it('forLoopWithContinueWithLabel', function() {
        let insns = compileMainSnippet(`loop1:
                                loop2:
                                loop3:
                                for (let i = 0; i < 5; ++i) {
                                    for (let j = 0; j < 6; j++) {
                                        continue loop2;
                                    }
                                }`);
        let i = new VReg();
        let j = new VReg();
        let lhs = new VReg();
        let labelPre = new Label();
        let labelPost = new Label();
        let labelIncr = new Label();
        let labelPre1 = new Label();
        let labelPost1 = new Label();
        let labelIncr1 = new Label();
        let expected = [
            // initializer
            new LdaiDyn(new Imm(ResultType.Int, 0.0)),
            new StaDyn(i),
            labelPre,
            // condition
            new LdaDyn(i),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 5.0)),
            new LessDyn(lhs),
            new Jeqz(labelPost),

            // second for
            new LdaiDyn(new Imm(ResultType.Int, 0.0)),
            new StaDyn(j),
            labelPre1,
            // condition
            new LdaDyn(j),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 6.0)),
            new LessDyn(lhs),
            new Jeqz(labelPost1),
            new Jmp(labelIncr),
            labelIncr1,
            // incrementor
            new LdaDyn(j),
            new StaDyn(j),
            new IncDyn(j),
            new StaDyn(j),
            new Tonumber(j),
            // jump to the loop header
            new Jmp(labelPre1),
            labelPost1,
            labelIncr,
            // incrementor
            new LdaDyn(i),
            new StaDyn(i),
            new IncDyn(i),
            new StaDyn(i),
            // jump to the loop header
            new Jmp(labelPre),
            labelPost,
            new ReturnUndefined()
        ];

        // check the instruction kinds are the same as we expect
        expect(checkInstructions(insns, expected)).to.be.true;
        // check break jumps to the expected instruction
        let jmp = <Jmp>insns[16];
        let targetLabel = (jmp).getTarget();
        expect(targetLabel).to.equal(insns[25]);
    });
});
