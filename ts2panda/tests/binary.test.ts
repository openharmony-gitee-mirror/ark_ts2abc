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
    And2Dyn,
    Ashr2Dyn,
    CreateEmptyObject,
    Div2Dyn,
    EqDyn,
    ExpDyn,
    GreaterDyn,
    GreaterEqDyn,
    Imm,
    IncDyn,
    InstanceOfDyn,
    IsInDyn,
    Jeqz,
    Jmp,
    Label,
    LdaDyn,
    LdaiDyn,
    LdaStr,
    LessDyn,
    LessEqDyn,
    Mod2Dyn,
    MovDyn,
    Mul2Dyn,
    NotEqDyn,
    Or2Dyn,
    ResultType,
    ReturnUndefined,
    Shl2Dyn,
    Shr2Dyn,
    StaDyn,
    StGlobalVar,
    StObjByName,
    StrictEqDyn,
    StrictNotEqDyn,
    Sub2Dyn,
    Toboolean,
    Tonumber,
    TryLdGlobalByName,
    TryStGlobalByName,
    VReg,
    Xor2Dyn
} from "../src/irnodes";
import { checkInstructions, compileMainSnippet } from "./utils/base";

describe("BinaryOperationsTest", function() {
    it("2 + 3", function() {
        let insns = compileMainSnippet("2 + 3");
        let lhs = new VReg();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new Add2Dyn(lhs),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("5 - 1", function() {
        let insns = compileMainSnippet("5 - 1");
        let lhs = new VReg();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new Sub2Dyn(lhs),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("null ?? 1", function() {
        let insns = compileMainSnippet("null ?? 1");

        let leftNullishLabel = new Label();
        let endLabel = new Label();
        let expected = [
            new LdaDyn(new VReg()),
            new StaDyn(new VReg()),
            new StrictNotEqDyn(new VReg()),
            new Jeqz(leftNullishLabel),
            new LdaDyn(new VReg()),
            new StrictNotEqDyn(new VReg()),
            new Jeqz(leftNullishLabel),
            new LdaDyn(new VReg()),
            new Jmp(endLabel),
            leftNullishLabel,
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            endLabel,
            new ReturnUndefined()
        ];

        expect(checkInstructions(insns, expected)).to.be.true;

        let jumps = insns.filter(item => item instanceof Jeqz || item instanceof Jmp)

        expect(jumps.length).to.equal(3);
    });

    it("undefined ?? 1", function() {
        let insns = compileMainSnippet("undefined ?? 1");

        let leftNullishLabel = new Label();
        let endLabel = new Label();
        let expected = [
            new LdaDyn(new VReg()),
            new StaDyn(new VReg()),
            new StrictNotEqDyn(new VReg()),
            new Jeqz(leftNullishLabel),
            new LdaDyn(new VReg()),
            new StrictNotEqDyn(new VReg()),
            new Jeqz(leftNullishLabel),

            new LdaDyn(new VReg()),
            new Jmp(endLabel),

            leftNullishLabel,
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            endLabel,
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;

        let jumps = insns.filter(item => item instanceof Jeqz || item instanceof Jmp)

        expect(jumps.length).to.equal(3);
    });

    it("2 ?? 1", function() {
        let insns = compileMainSnippet("2 ?? 1");
        let lhs = new VReg();

        let leftNullishLabel = new Label();
        let endLabel = new Label();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(new VReg()),
            new StrictNotEqDyn(new VReg()),
            new Jeqz(leftNullishLabel),
            new LdaDyn(new VReg()),
            new StrictNotEqDyn(new VReg()),
            new Jeqz(leftNullishLabel),

            new LdaDyn(lhs),
            new Jmp(endLabel),

            leftNullishLabel,
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            endLabel,
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;

        let jumps = insns.filter(item => item instanceof Jeqz || item instanceof Jmp)

        expect(jumps.length).to.equal(3);
    });

    it("3 * 4", function() {
        let insns = compileMainSnippet("3 * 4");
        let lhs = new VReg();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 4)),
            new Mul2Dyn(lhs),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("2 ** 3", function() {
        let insns = compileMainSnippet("2 ** 3");
        let lhs = new VReg();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new ExpDyn(lhs),
            new ReturnUndefined(),
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("7 / 1", function() {
        let insns = compileMainSnippet("7 / 1");
        let lhs = new VReg();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 7)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new Div2Dyn(lhs),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("8 % 2", function() {
        let insns = compileMainSnippet("8 % 2");
        let lhs = new VReg();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 8)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new Mod2Dyn(lhs),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("2 << 3", function() {
        let insns = compileMainSnippet("2 << 3");
        let lhs = new VReg();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new Shl2Dyn(lhs),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("4 >> 1", function() {
        let insns = compileMainSnippet("4 >> 1");
        let lhs = new VReg();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 4)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new Shr2Dyn(lhs),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("12 >>> 2", function() {
        let insns = compileMainSnippet("12 >>> 2");
        let lhs = new VReg();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 12)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new Ashr2Dyn(lhs),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("3 & 4", function() {
        let insns = compileMainSnippet("3 & 4");
        let lhs = new VReg();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 4)),
            new And2Dyn(lhs),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("2 | 5", function() {
        let insns = compileMainSnippet("2 | 5");
        let lhs = new VReg();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new Or2Dyn(lhs),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("7 ^ 3", function() {
        let insns = compileMainSnippet("7 ^ 3");
        let lhs = new VReg();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 7)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new Xor2Dyn(lhs),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("let i; i = 2", function() {
        let insns = compileMainSnippet("let i; i = 2;");
        let i = new VReg();
        let expected = [
            new LdaDyn(new VReg()),
            new StaDyn(i),
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(i),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("a = 1 under strict mode", function() {
        let insns = compileMainSnippet(`
                                        "use strict";
                                        a = 1;
                                        `);
        let expected = [
            new LdaStr("use strict"),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new TryStGlobalByName("a"),
            new ReturnUndefined()
        ];

        expect(checkInstructions(insns, expected)).to.be.true;
    })

    it("Assignment to ParenthesizedExpression case1", function() {
        let insns = compileMainSnippet("((x)) = 1;");

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StGlobalVar("x"),
            new ReturnUndefined()
        ];

        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("Assignment to ParenthesizedExpression case2", function() {
        let insns = compileMainSnippet(`let a = {};
                                ((a.b)) = 1;`);
        let objReg = new VReg();
        let tempObj = new VReg();

        let expected = [
            new CreateEmptyObject(),
            new StaDyn(new VReg()),
            new StaDyn(objReg),
            // insns for `((a.b)) = 1`
            new LdaDyn(objReg),
            new StaDyn(tempObj),
            new MovDyn(objReg, tempObj),
            new LdaiDyn(new Imm(ResultType.Int, 1)),

            new StObjByName("b", objReg),
            new ReturnUndefined()
        ]
        expect(checkInstructions(insns, expected)).to.be.true;
    });
});

describe("OperationEqualTest", function() {
    it("plusEqual", function() {
        let insns = compileMainSnippet("let a = 2;\n" +
            "a += 3;");
        let a = new VReg();
        let lhs = new VReg();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(a),
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new Add2Dyn(lhs),
            new StaDyn(a),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("minusEqual", function() {
        let insns = compileMainSnippet("let a = 5;\n" +
            "a -= 7;");
        let a = new VReg();
        let lhs = new VReg();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StaDyn(a),
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 7)),
            new Sub2Dyn(lhs),
            new StaDyn(a),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("asteriskEqual", function() {
        let insns = compileMainSnippet("let a = 2;\n" +
            "a *= 4;");
        let a = new VReg();
        let lhs = new VReg();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(a),
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 4)),
            new Mul2Dyn(lhs),
            new StaDyn(a),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("AsteriskAsteriskEqualsToken", function() {
        let insns = compileMainSnippet("let a = 2;\n" +
            "a **= 3;");
        let a = new VReg();
        let lhs = new VReg();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(a),
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new ExpDyn(lhs),
            new StaDyn(a),
            new ReturnUndefined()
        ]
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("slashEqual", function() {
        let insns = compileMainSnippet("let a = 5;\n" +
            "a /= 3;");
        let a = new VReg();
        let lhs = new VReg();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StaDyn(a),
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new Div2Dyn(lhs),
            new StaDyn(a),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("percentEqual", function() {
        let insns = compileMainSnippet("let a = 15;\n" +
            "a %= 7;");
        let a = new VReg();
        let lhs = new VReg();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 15)),
            new StaDyn(a),
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 7)),
            new Mod2Dyn(lhs),
            new StaDyn(a),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("lessThanLessThanEqual", function() {
        let insns = compileMainSnippet("let a = 8;\n" +
            "a <<= 3;");
        let a = new VReg();
        let lhs = new VReg();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 8)),
            new StaDyn(a),
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new Shl2Dyn(lhs),
            new StaDyn(a),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("greaterThanGreaterThanEqual", function() {
        let insns = compileMainSnippet("let a = 4;\n" +
            "a >>= 1;");
        let a = new VReg();
        let lhs = new VReg();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 4)),
            new StaDyn(a),
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new Shr2Dyn(lhs),
            new StaDyn(a),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("greaterThanGreaterThanGreaterThanEqual", function() {
        let insns = compileMainSnippet("let a = 8;\n" +
            "a >>>= 2;");
        let a = new VReg();
        let lhs = new VReg();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 8)),
            new StaDyn(a),
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new Ashr2Dyn(lhs),
            new StaDyn(a),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });
});

describe("LogicBinaryOperators", function() {
    it("ampersandAmpersand", function() {
        let insns = compileMainSnippet("8 && false;");
        let lhs = new VReg();
        let preLabel = new Label();
        let postLabel = new Label();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 8)),
            new StaDyn(lhs),
            new Toboolean(),
            new EqDyn(new VReg()),
            new Jeqz(preLabel),
            new LdaDyn(new VReg()),
            new Jmp(postLabel),
            preLabel,
            new LdaDyn(lhs),
            postLabel,
            new ReturnUndefined()
        ]

        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("barBar", function() {
        let insns = compileMainSnippet("8 || false;");
        let lhs = new VReg();
        let rhs = new VReg();
        let preLabel = new Label();
        let postLabel = new Label();
        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 8)),
            new StaDyn(lhs),
            new Toboolean(),
            new EqDyn(rhs),
            new Jeqz(preLabel),
            new LdaDyn(new VReg()),
            new Jmp(postLabel),
            preLabel,
            new LdaDyn(lhs),
            postLabel,
            new ReturnUndefined()
        ]

        expect(checkInstructions(insns, expected)).to.be.true;
    });
});

describe("CmpBinaryOperators", function() {
    it("LessThan", function() {
        let insns = compileMainSnippet("2 < 3;");
        let lhs = new VReg();
        let falseLabel = new Label();
        let endLabel = new Label();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new LessDyn(lhs),
            new Jeqz(falseLabel),
            new LdaDyn(new VReg()),
            new Jmp(endLabel),
            falseLabel,
            new LdaDyn(new VReg()),
            endLabel,
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("GreaterThan", function() {
        let insns = compileMainSnippet("3 > 1;");
        let lhs = new VReg();
        let falseLabel = new Label();
        let endLabel = new Label();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new GreaterDyn(lhs),
            new Jeqz(falseLabel),
            new LdaDyn(new VReg()),
            new Jmp(endLabel),
            falseLabel,
            new LdaDyn(new VReg()),
            endLabel,
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("LessThanEquals", function() {
        let insns = compileMainSnippet("3 <= 4;");
        let lhs = new VReg();
        let falseLabel = new Label();
        let endLabel = new Label();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 4)),
            new LessEqDyn(lhs),
            new Jeqz(falseLabel),
            new LdaDyn(new VReg()),
            new Jmp(endLabel),
            falseLabel,
            new LdaDyn(new VReg()),
            endLabel,
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("GreaterThanEquals", function() {
        let insns = compileMainSnippet("3 >= 2;");
        let lhs = new VReg();
        let falseLabel = new Label();
        let endLabel = new Label();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new GreaterEqDyn(lhs),
            new Jeqz(falseLabel),
            new LdaDyn(new VReg()),
            new Jmp(endLabel),
            falseLabel,
            new LdaDyn(new VReg()),
            endLabel,
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("EqualsEquals", function() {
        let insns = compileMainSnippet("3 == 3;");
        let lhs = new VReg();
        let falseLabel = new Label();
        let endLabel = new Label();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new EqDyn(lhs),
            new Jeqz(falseLabel),
            new LdaDyn(new VReg()),
            new Jmp(endLabel),
            falseLabel,
            new LdaDyn(new VReg()),
            endLabel,
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("ExclamationEquals", function() {
        let insns = compileMainSnippet("3 != 2;");
        let lhs = new VReg();
        let falseLabel = new Label();
        let endLabel = new Label();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new NotEqDyn(lhs),
            new Jeqz(falseLabel),
            new LdaDyn(new VReg()),
            new Jmp(endLabel),
            falseLabel,
            new LdaDyn(new VReg()),
            endLabel,
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("EqualsEqualsEquals", function() {
        let insns = compileMainSnippet("3 === 3;");
        let lhs = new VReg();
        let falseLabel = new Label();
        let endLabel = new Label();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StrictEqDyn(lhs),
            new Jeqz(falseLabel),
            new LdaDyn(new VReg()),
            new Jmp(endLabel),
            falseLabel,
            new LdaDyn(new VReg()),
            endLabel,
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("ExclamationEqualsEquals", function() {
        let insns = compileMainSnippet("3 !== 3;");
        let lhs = new VReg();
        let falseLabel = new Label();
        let endLabel = new Label();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StrictNotEqDyn(lhs),
            new Jeqz(falseLabel),
            new LdaDyn(new VReg()),
            new Jmp(endLabel),
            falseLabel,
            new LdaDyn(new VReg()),
            endLabel,
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("ampersandEqual", function() {
        let insns = compileMainSnippet("let a = 5;\n" +
            "a &= 3;");
        let a = new VReg();
        let lhs = new VReg();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StaDyn(a),
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new And2Dyn(lhs),
            new StaDyn(a),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("barEqual", function() {
        let insns = compileMainSnippet("let a = 5;\n" +
            "a |= 3;");
        let a = new VReg();
        let lhs = new VReg();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StaDyn(a),
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new Or2Dyn(lhs),
            new StaDyn(a),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("caretEqual", function() {
        let insns = compileMainSnippet("let a = 5;\n" +
            "a ^= 3;");
        let a = new VReg();
        let lhs = new VReg();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new StaDyn(a),
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new Xor2Dyn(lhs),
            new StaDyn(a),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("CommaToken", function() {
        let insns = compileMainSnippet(`let x = 1;
                                x = (x++, x);`);
        let variable = new VReg();
        let rhs = new VReg();
        let lhs = new VReg();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StaDyn(variable),
            new LdaDyn(variable),
            new StaDyn(lhs),
            new IncDyn(lhs),
            new StaDyn(variable),
            new Tonumber(variable),
            new StaDyn(rhs),
            new LdaDyn(variable),
            new StaDyn(variable),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("InKeyword", function() {
        let insns = compileMainSnippet(`'o' in C;`);
        let rhs = new VReg();

        let expected = [
            new LdaStr('o'),
            new StaDyn(rhs),
            new TryLdGlobalByName("C"),
            new IsInDyn(rhs),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("InstanceOfKeyword", function() {
        let insns = compileMainSnippet(`o instanceof C;`);
        let rhs = new VReg();

        let expected = [
            new TryLdGlobalByName("o"),
            new StaDyn(rhs),
            new TryLdGlobalByName("C"),
            new InstanceOfDyn(rhs),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });

});
