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

/**
 * Imlementation of bytecode generator.
 * The PandaGen works with IR and provides an API
 * to the compiler.
 *
 * This file should not contain imports of TypeScipt's AST nodes.
 */
import * as ts from "typescript";
import {
    BinaryOperator,
    PrefixUnaryOperator,
    SyntaxKind
} from "typescript";
import {
    call,
    closeIterator,
    copyDataProperties,
    copyModuleIntoCurrentModule,
    creatDebugger,
    createArrayWithBuffer,
    createEmptyArray,
    createEmptyObject,
    createObjectHavingMethod,
    createObjectWithBuffer,
    createObjectWithExcludedKeys,
    setObjectWithProto,
    defineClassWithBuffer,
    defineGetterSetterByValue,
    deleteObjProperty,
    getIterator,
    getIteratorNext,
    getNextPropName,
    getPropIterator,
    importModule,
    jumpTarget,
    ldSuperByName,
    ldSuperByValue,
    loadAccumulator,
    loadAccumulatorFloat,
    loadAccumulatorInt,
    loadAccumulatorString,
    loadGlobalVar,
    loadHomeObject,
    loadLexicalEnv,
    loadLexicalVar,
    loadModuleVarByName,
    loadObjByIndex,
    loadObjByName,
    loadObjByValue,
    moveVreg,
    newLexicalEnv,
    newObject,
    popLexicalEnv,
    returnUndefined,
    storeAccumulator,
    storeArraySpread,
    storeGlobalVar,
    storeLexicalVar,
    storeModuleVariable,
    storeObjByIndex,
    storeObjByName,
    storeObjByValue,
    storeOwnByIndex,
    storeOwnByName,
    storeOwnByValue,
    stSuperByName,
    stSuperByValue,
    superCall,
    superCallSpread,
    throwException,
    throwDeleteSuperProperty,
    throwIfNotObject,
    throwIfSuperNotCorrectCall,
    throwObjectNonCoercible,
    throwThrowNotExists,
    throwUndefinedIfHole,
    tryLoadGlobalByName,
    tryLoadGlobalByValue,
    tryStoreGlobalByName,
    tryStoreGlobalByValue
} from "./base/bcGenUtil";
import {
    CacheList,
    getVregisterCache,
    VregisterCache
} from "./base/vregisterCache";
import { CmdOptions } from "./cmdOptions";
import { Compiler } from "./compiler";
import {
    DebugInfo,
    NodeKind,
    VariableDebugInfo
} from "./debuginfo";
import { isInteger } from "./expression/numericLiteral";
import { LiteralBuffer } from "./base/literal";
import {
    Add2Dyn,
    And2Dyn,
    Ashr2Dyn,
    AsyncFunctionAwaitUncaughtDyn,
    AsyncFunctionEnterDyn,
    AsyncFunctionRejectDyn,
    AsyncFunctionResolveDyn,
    CallSpread,
    CopyRestArgs,
    CreateGeneratorObjDyn,
    CreateIterResultObjectDyn,
    DecDyn,
    DefineAsyncFuncDyn,
    DefinefuncDyn,
    DefineGeneratorfuncDyn,
    DefineMethod,
    DefineNCFuncDyn,
    Div2Dyn,
    EqDyn,
    ExpDyn,
    GetResumeModeDyn,
    GetTemplateObject,
    GetUnmappedArgs,
    GreaterDyn,
    GreaterEqDyn,
    Imm,
    IncDyn,
    InstanceOfDyn,
    IRNode,
    IsInDyn,
    Jeqz,
    Label,
    LessDyn,
    LessEqDyn,
    Mod2Dyn,
    Mul2Dyn,
    NegDyn,
    NewobjSpread,
    NotDyn,
    NotEqDyn,
    Or2Dyn,
    ResultType,
    ResumeGeneratorDyn,
    ReturnDyn,
    Shl2Dyn,
    Shr2Dyn,
    StrictEqDyn,
    StrictNotEqDyn,
    Sub2Dyn,
    SuspendGeneratorDyn,
    Toboolean,
    Tonumber,
    TypeOfDyn,
    VReg,
    Xor2Dyn
} from "./irnodes";
import {
    VariableAccessLoad,
    VariableAcessStore
} from "./lexenv";
import { LOGE } from "./log";
import {
    FunctionScope,
    LoopScope,
    Scope,
    VariableScope
} from "./scope";
import { CatchTable } from "./statement/tryStatement";
import {
    Variable
} from "./variable";

export class PandaGen {
    private debugTag: string = "PandaGen";
    readonly internalName: string;
    private parametersCount: number;
    private locals: VReg[] = [];
    private temps: VReg[] = [];
    private insns: IRNode[] = [];
    private scope: Scope | undefined;
    private vregisterCache: VregisterCache;
    private catchMap: Map<Label, CatchTable> = new Map<Label, CatchTable>();
    private totalRegsNum = 0;
    // for debug info
    private variableDebugInfoArray: VariableDebugInfo[] = [];
    private firstStmt: ts.Statement | undefined;
    private sourceFileDebugInfo: string = "";
    private sourceCodeDebugInfo: string | undefined;
    private icSize: number = 0;

    private static literalArrayBuffer: Array<LiteralBuffer> = [];

    constructor(internalName: string, parametersCount: number, scope: Scope | undefined = undefined) {
        this.internalName = internalName;
        this.parametersCount = parametersCount;
        this.scope = scope;
        this.vregisterCache = new VregisterCache();
    }

    public getSourceCodeDebugInfo() {
        return this.sourceCodeDebugInfo;
    }

    public setSourceCodeDebugInfo(code: string) {
        this.sourceCodeDebugInfo = code;
    }

    public getSourceFileDebugInfo() {
        return this.sourceFileDebugInfo;
    }

    public setSourceFileDebugInfo(sourceFile: string) {
        this.sourceFileDebugInfo = sourceFile;
    }

    static getLiteralArrayBuffer() {
        return PandaGen.literalArrayBuffer;
    }

    static clearLiteralArrayBuffer() {
        PandaGen.literalArrayBuffer = [];
    }

    getParameterLength() {
        if (this.scope instanceof FunctionScope) {
            return this.scope.getParameterLength();
        }
    }

    getFuncName() {
        if (this.scope instanceof FunctionScope) {
            return this.scope.getFuncName();
        } else {
            return "main";
        }
    }

    getICSize() {
        return this.icSize;
    }

    setICSize(total: number) {
        this.icSize = total;
    }

    getFirstStmt() {
        return this.firstStmt;
    }

    setFirstStmt(firstStmt: ts.Statement) {
        if (this.firstStmt) {
            return;
        }
        this.firstStmt = firstStmt;
    }

    getVregisterCache() {
        return this.vregisterCache;
    }

    getCatchMap() {
        return this.catchMap;
    }

    getScope(): Scope | undefined {
        return this.scope;
    }

    getVariableDebugInfoArray(): VariableDebugInfo[] {
        return this.variableDebugInfoArray;
    }

    addDebugVariableInfo(variable: VariableDebugInfo) {
        this.variableDebugInfoArray.push(variable);
    }

    allocLocalVreg(): VReg {
        let vreg = new VReg();
        this.locals.push(vreg);
        return vreg;
    }

    getVregForVariable(v: Variable): VReg {
        if (v.hasAlreadyBinded()) {
            return v.getVreg();
        }
        let vreg = this.allocLocalVreg();
        v.bindVreg(vreg);
        return vreg;
    }

    getTemp(): VReg {
        let retval: VReg;
        if (this.temps.length > 0) {
            retval = this.temps.shift()!;
        } else {
            retval = new VReg();
        }

        if (CmdOptions.isEnableDebugLog()) {
            if (retval.getStackTrace() !== undefined) {
                throw new Error("stack trace of new temp register is not empty");
            }
            retval.setStackTrace();
        }
        return retval;
    }

    freeTemps(...temps: VReg[]) {
        if (CmdOptions.isEnableDebugLog())
            for (let value of temps)
                value.setStackTrace(null);

        this.temps.unshift(...temps);
    }

    getInsns(): IRNode[] {
        return this.insns;
    }

    printInsns() {
        LOGE("function " + this.internalName + "() {");
        this.getInsns().forEach(ins => {
            LOGE(ins.toString());
        })
        LOGE("}");
    }

    setTotalRegsNum(num: number) {
        this.totalRegsNum = num;
    }

    getTotalRegsNum(): number {
        return this.totalRegsNum;
    }

    getParametersCount(): number {
        return this.parametersCount;
    }

    getLocals(): VReg[] {
        return this.locals;
    }

    getTemps(): VReg[] {
        return this.temps;
    }

    storeAccumulator(node: ts.Node | NodeKind, vreg: VReg) {
        this.add(node, storeAccumulator(vreg));
    }

    loadAccFromArgs(node: ts.Node) {
        if ((<VariableScope>this.scope).getUseArgs()) {
            let v = this.scope!.findLocal("arguments");
            if (v) {
                let paramVreg = this.getVregForVariable(v);
                this.getUnmappedArgs(node);
                this.add(node, storeAccumulator(paramVreg));
            } else {
                throw new Error("fail to get arguments");
            }
        }
    }

    deleteObjProperty(node: ts.Node, obj: VReg, prop: VReg) {
        this.add(node, deleteObjProperty(obj, prop));
    }

    loadAccumulator(node: ts.Node | NodeKind, vreg: VReg) {
        this.add(node, loadAccumulator(vreg));
    }

    createLexEnv(node: ts.Node, env: VReg, scope: VariableScope | LoopScope) {
        let needCreateNewEnv = scope.need2CreateLexEnv();
        let numVars = scope.getNumLexEnv();
        if (needCreateNewEnv) {
            this.add(
                node,
                newLexicalEnv(numVars),
                storeAccumulator(env)
            )
        } else {
            this.add(
                node,
                loadLexicalEnv(),
                storeAccumulator(env)
            )

        }
    }

    popLexicalEnv(node: ts.Node) {
        this.add(
            node,
            popLexicalEnv()
        )
    }

    loadAccFromLexEnv(node: ts.Node, scope: Scope, level: number, v: Variable) {
        let expander = new VariableAccessLoad(scope, level, v);
        let insns = expander.expand(this);
        this.add(
            node,
            ...insns
        );
    }

    storeAccToLexEnv(node: ts.Node | NodeKind, scope: Scope, level: number, v: Variable, isDeclaration: boolean) {
        let expander = new VariableAcessStore(scope, level, v, isDeclaration, node);
        let insns = expander.expand(this);
        this.add(
            node,
            ...insns
        )
    }

    loadObjProperty(node: ts.Node, obj: VReg, prop: VReg | string | number) {
        switch (typeof (prop)) {
            case "number":
                this.loadObjByIndex(node, obj, prop);
                break;
            case "string":
                this.loadObjByName(node, obj, prop);
                break;
            default:
                this.loadObjByValue(node, obj, prop);
        }
    }

    storeObjProperty(node: ts.Node | NodeKind, obj: VReg, prop: VReg | string | number) {
        switch (typeof (prop)) {
            case "number":
                this.storeObjByIndex(node, obj, prop);
                break;
            case "string":
                this.storeObjByName(node, obj, prop);
                break;
            default:
                this.storeObjByValue(node, obj, prop);
        }
    }

    storeOwnProperty(node: ts.Node | NodeKind, obj: VReg, prop: VReg | string | number) {
        if (typeof (prop) == "string") {
            this.stOwnByName(node, obj, prop);
        } else if (typeof (prop) == "number") {
            this.stOwnByIndex(node, obj, prop);
        } else {
            this.stOwnByValue(node, obj, prop);
        }
    }

    private loadObjByName(node: ts.Node, obj: VReg, string_id: string) {
        this.add(
            node,
            loadObjByName(obj, string_id));
    }

    private storeObjByName(node: ts.Node | NodeKind, obj: VReg, string_id: string) {
        this.add(node, storeObjByName(obj, string_id));
    }

    private loadObjByIndex(node: ts.Node, obj: VReg, index: number) {
        let indexReg = this.getTemp();
        if (isInteger(index)) {
            this.add(
                node,
                loadAccumulatorInt(index)
            );
        } else {
            this.add(
                node,
                loadAccumulatorFloat(index)
            );
        }
        this.add(
            node,
            storeAccumulator(indexReg),
            loadObjByIndex(obj, indexReg)
        );
        this.freeTemps(indexReg);
    }

    private storeObjByIndex(node: ts.Node | NodeKind, obj: VReg, index: number) {
        let indexReg = this.getTemp();
        let valueReg = this.getTemp();
        this.add(node, storeAccumulator(valueReg));
        if (isInteger(index)) {
            this.add(
                node,
                loadAccumulatorInt(index)
            );
        } else {
            this.add(
                node,
                loadAccumulatorFloat(index)
            );
        }
        this.add(
            node,
            storeAccumulator(indexReg),
            loadAccumulator(valueReg),
            storeObjByIndex(obj, indexReg));
        this.freeTemps(indexReg, valueReg);
    }


    private loadObjByValue(node: ts.Node, obj: VReg, value: VReg) {
        this.add(
            node,
            loadObjByValue(obj, value)
        )
    }

    private storeObjByValue(node: ts.Node | NodeKind, obj: VReg, prop: VReg) {
        this.add(
            node,
            storeObjByValue(obj, prop)
        )
    }

    private stOwnByName(node: ts.Node | NodeKind, obj: VReg, string_id: string) {
        this.add(node, storeOwnByName(obj, string_id));
    }

    private stOwnByIndex(node: ts.Node | NodeKind, obj: VReg, index: number) {
        let indexReg = this.getTemp();
        let valueReg = this.getTemp();
        this.add(node, storeAccumulator(valueReg));
        if (isInteger(index)) {
            this.add(
                node,
                loadAccumulatorInt(index)
            );
        } else {
            this.add(
                node,
                loadAccumulatorFloat(index)
            );
        }
        this.add(
            node,
            storeAccumulator(indexReg),
            loadAccumulator(valueReg),
            storeOwnByIndex(obj, indexReg));
        this.freeTemps(indexReg, valueReg);
    }

    private stOwnByValue(node: ts.Node | NodeKind, obj: VReg, value: VReg) {
        this.add(node, storeOwnByValue(obj, value));
    }

    tryLoadGlobalByValue(node: ts.Node, key: VReg) {
        this.add(
            node,
            tryLoadGlobalByValue(key)
        )
    }


    tryStoreGlobalByValue(node: ts.Node, key: VReg) {
        this.add(
            node,
            tryStoreGlobalByValue(key)
        )
    }

    // eg. print
    tryLoadGlobalByName(node: ts.Node, string_id: string) {
        this.add(
            node,
            tryLoadGlobalByName(string_id));
    }

    // eg. a = 1
    tryStoreGlobalByName(node: ts.Node, string_id: string) {
        this.add(node,
            tryStoreGlobalByName(string_id));
    }

    // eg. var n; n;
    loadGlobalVar(node: ts.Node, string_id: string) {
        this.add(
            node,
            loadGlobalVar(string_id));
    }

    // var n = 1;
    storeGlobalVar(node: ts.Node | NodeKind, string_id: string) {
        this.add(
            node,
            storeGlobalVar(string_id));
    }

    loadAccumulatorString(node: ts.Node | NodeKind, str: string) {
        this.add(node, loadAccumulatorString(str));
    }

    loadAccumulatorFloat(node: ts.Node, num: number) {
        this.add(node, loadAccumulatorFloat(num));
    }

    loadAccumulatorInt(node: ts.Node, num: number) {
        this.add(node, loadAccumulatorInt(num));
    }

    moveVreg(node: ts.Node | NodeKind, vd: VReg, vs: VReg) {
        this.add(node, moveVreg(vd, vs));
    }

    label(node: ts.Node, label: Label) {
        this.add(NodeKind.FirstNodeOfFunction, label);
    }

    branch(node: ts.Node | NodeKind, target: Label) {
        this.add(node, jumpTarget(target));
    }

    debugger(node: ts.Node) {
        this.add(node, creatDebugger());
    }

    throwUndefinedIfHole(node: ts.Node, hole: VReg, name: VReg) {
        this.add(
            node,
            throwUndefinedIfHole(hole, name)
        )
    }

    /**
     * The method generates code for ther following cases
     *          if (lhs OP acc) {...}
     * ifFalse: ...
     */
    condition(node: ts.Node, op: SyntaxKind, lhs: VReg, ifFalse: Label) {
        // Please keep order of cases the same as in types.ts
        switch (op) {
            case SyntaxKind.LessThanToken: // line 57
                this.add(node, new LessDyn(lhs));
                this.add(node, new Jeqz(ifFalse));
                break;
            case SyntaxKind.GreaterThanToken: // line 59
                this.add(node, new GreaterDyn(lhs));
                this.add(node, new Jeqz(ifFalse));
                break;
            case SyntaxKind.LessThanEqualsToken: // line 60
                this.add(node, new LessEqDyn(lhs));
                this.add(node, new Jeqz(ifFalse));
                break;
            case SyntaxKind.GreaterThanEqualsToken: // line 61
                this.add(node, new GreaterEqDyn(lhs));
                this.add(node, new Jeqz(ifFalse));
                break;
            case SyntaxKind.EqualsEqualsToken: // line 62
                this.add(node, new EqDyn(lhs));
                this.add(node, new Jeqz(ifFalse));
                break;
            case SyntaxKind.ExclamationEqualsToken: // line 63
                this.add(node, new NotEqDyn(lhs));
                this.add(node, new Jeqz(ifFalse));
                break;
            case SyntaxKind.EqualsEqualsEqualsToken: // line 64
                this.add(node, new StrictEqDyn(lhs));
                this.add(node, new Jeqz(ifFalse));
                break;
            case SyntaxKind.ExclamationEqualsEqualsToken: // line 65
                this.add(node, new StrictNotEqDyn(lhs));
                this.add(node, new Jeqz(ifFalse));
                break;
            default:
                throw new Error("unimplemented op");
        }
    }

    unary(node: ts.Node, op: PrefixUnaryOperator, operand: VReg) {
        switch (op) {
            case SyntaxKind.PlusToken:
                this.add(node, new Tonumber(operand));
                break;
            case SyntaxKind.MinusToken:
                this.add(node, new NegDyn(operand));
                break;
            case SyntaxKind.PlusPlusToken:
                this.add(node, new IncDyn(operand));
                break;
            case SyntaxKind.MinusMinusToken:
                this.add(node, new DecDyn(operand));
                break;
            case SyntaxKind.ExclamationToken:
                let falseLabel = new Label();
                let endLabel = new Label();
                this.toBoolean(node);
                this.condition(node, SyntaxKind.EqualsEqualsToken, getVregisterCache(this, CacheList.True), falseLabel);
                // operand is true
                this.add(node, loadAccumulator(getVregisterCache(this, CacheList.False)));
                this.branch(node, endLabel);
                // operand is false
                this.label(node, falseLabel);
                this.add(node, loadAccumulator(getVregisterCache(this, CacheList.True)));
                this.label(node, endLabel);
                break;
            case SyntaxKind.TildeToken:
                this.add(node, new NotDyn(operand));
                break;
            default:
                throw new Error("Unimplemented");
        }
    }

    binary(node: ts.Node, op: BinaryOperator, lhs: VReg) {
        switch (op) {
            case SyntaxKind.LessThanToken: // line 57
            case SyntaxKind.GreaterThanToken: // line 59
            case SyntaxKind.LessThanEqualsToken: // line 60
            case SyntaxKind.GreaterThanEqualsToken: // line 61
            case SyntaxKind.EqualsEqualsToken: // line 62
            case SyntaxKind.ExclamationEqualsToken: // line 63
            case SyntaxKind.EqualsEqualsEqualsToken: // line 64
            case SyntaxKind.ExclamationEqualsEqualsToken: // line 65
                this.binaryRelation(node, op, lhs);
                break;
            case SyntaxKind.PlusToken: // line 67
            case SyntaxKind.PlusEqualsToken: // line 91
                this.add(node, new Add2Dyn(lhs));
                break;
            case SyntaxKind.MinusToken: // line 68
            case SyntaxKind.MinusEqualsToken: // line 92
                this.add(node, new Sub2Dyn(lhs));
                break;
            case SyntaxKind.AsteriskToken: // line 69
            case SyntaxKind.AsteriskEqualsToken: // line 93
                this.add(node, new Mul2Dyn(lhs));
                break;
            case SyntaxKind.AsteriskAsteriskToken: // line 70
            case SyntaxKind.AsteriskAsteriskEqualsToken: // line 94
                this.add(node, new ExpDyn(lhs));
                break;
            case SyntaxKind.SlashToken: // line 71
            case SyntaxKind.SlashEqualsToken: // line 95
                this.add(node, new Div2Dyn(lhs));
                break;
            case SyntaxKind.PercentToken: // line 72
            case SyntaxKind.PercentEqualsToken: // line 96
                this.add(node, new Mod2Dyn(lhs));
                break;
            case SyntaxKind.LessThanLessThanToken: // line 75
            case SyntaxKind.LessThanLessThanEqualsToken: // line 97
                this.add(node, new Shl2Dyn(lhs));
                break;
            case SyntaxKind.GreaterThanGreaterThanToken: // line 76
            case SyntaxKind.GreaterThanGreaterThanEqualsToken: // line 98
                this.add(node, new Shr2Dyn(lhs));
                break;
            case SyntaxKind.GreaterThanGreaterThanGreaterThanToken: // line 77
            case SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken: // line 99
                this.add(node, new Ashr2Dyn(lhs));
                break;
            case SyntaxKind.AmpersandToken: // line 78
            case SyntaxKind.AmpersandEqualsToken: // line 100
                this.add(node, new And2Dyn(lhs));
                break;
            case SyntaxKind.BarToken: // line 79
            case SyntaxKind.BarEqualsToken: // line 101
                this.add(node, new Or2Dyn(lhs));
                break;
            case SyntaxKind.CaretToken: // line 80
            case SyntaxKind.CaretEqualsToken: // line 102
                this.add(node, new Xor2Dyn(lhs));
                break;
            case SyntaxKind.InKeyword: //line 125
                // The in operator returns true if the specified property is in the specified object or its prototype chain
                this.add(node, new IsInDyn(lhs));
                break;
            case SyntaxKind.InstanceOfKeyword: //line 126
                // The instanceof operator tests to see if the prototype property of
                // a constructor appears anywhere in the prototype chain of an object.
                // The return value is a boolean value.
                this.add(node, new InstanceOfDyn(lhs));
                break;
            default:
                throw new Error("Unimplemented");
        }
    }

    // throw needs argument of exceptionVreg
    // to ensure rethrow the exception after finally
    throw(node: ts.Node) {
        this.add(
            node,
            throwException()
        );
    }

    throwThrowNotExist(node: ts.Node) {
        this.add(node, throwThrowNotExists());
    }

    throwDeleteSuperProperty(node: ts.Node) {
        this.add(node, throwDeleteSuperProperty());
    }

    return(node: ts.Node | NodeKind) {
        this.add(node, new ReturnDyn());
    }

    call(node: ts.Node, args: VReg[], passThis: boolean) {
        this.add(
            node,
            call(args, passThis)
        )
    }

    returnUndefined(node: ts.Node | NodeKind) {
        this.add(
            node,
            returnUndefined()
        )
    }

    newObject(node: ts.Node, args: VReg[]) {
        this.add(
            node,
            newObject(args)
        );
    }

    defineMethod(node: ts.FunctionLikeDeclaration, name: string, objReg: VReg, env: VReg) {
        this.add(node,
            loadAccumulator(objReg),
            new DefineMethod(name, env)
        );
    }

    defineFuncDyn(node: ts.FunctionLikeDeclaration | ts.ClassLikeDeclaration | NodeKind, name: string, env: VReg) {
        this.add(node, new DefinefuncDyn(name, env));
    }

    defineFunction(node: ts.FunctionLikeDeclaration | ts.ClassLikeDeclaration | NodeKind, realNode: ts.FunctionLikeDeclaration, name: string, env: VReg) {
        if (realNode.modifiers) {
            for (let i = 0; i < realNode.modifiers.length; i++) {
                if (realNode.modifiers[i].kind == ts.SyntaxKind.AsyncKeyword) {
                    if (realNode.asteriskToken) {
                        // support async* further
                    } else { // async
                        this.add(
                            node,
                            new DefineAsyncFuncDyn(name, env)
                        );
                        return;
                    }
                }
            }
        }

        if (realNode.asteriskToken) {
            this.add(
                node,
                new DefineGeneratorfuncDyn(name, env)
            );
            return;
        }

        if (ts.isArrowFunction(realNode) || ts.isMethodDeclaration(realNode)) {
            this.add(
                node,
                loadHomeObject(),
                new DefineNCFuncDyn(name, env)
            );
            return;
        }

        this.add(
            node,
            new DefinefuncDyn(name, env)
        );
    }

    typeOf(node: ts.Node) {
        this.add(node, new TypeOfDyn());
    }

    callSpread(node: ts.Node, func: VReg, thisReg: VReg, args: VReg) {
        this.add(node, new CallSpread(func, thisReg, args));
    }

    newObjSpread(node: ts.Node, obj: VReg, target: VReg) {
        this.add(node, new NewobjSpread(obj, target));
    }

    getUnmappedArgs(node: ts.Node) {
        this.add(node, new GetUnmappedArgs());
    }

    toBoolean(node: ts.Node) {
        this.add(node, new Toboolean());
    }

    toNumber(node: ts.Node, arg: VReg) {
        this.add(node, new Tonumber(arg));
    }

    createGeneratorObj(node: ts.Node, funcObj: VReg) {
        this.add(node, new CreateGeneratorObjDyn(funcObj));
    }

    createIterResultObjectDyn(node: ts.Node, value: VReg, done: VReg) {
        this.add(node, new CreateIterResultObjectDyn(value, done));
    }

    suspendGenerator(node: ts.Node, genObj: VReg, iterRslt: VReg) {
        this.add(node, new SuspendGeneratorDyn(genObj, iterRslt));
    }

    resumeGenerator(node: ts.Node, genObj: VReg) {
        this.add(node, new ResumeGeneratorDyn(genObj));
    }

    getResumeMode(node: ts.Node, genObj: VReg) {
        this.add(node, new GetResumeModeDyn(genObj));
    }

    asyncFunctionEnter(node: ts.Node) {
        this.add(node, new AsyncFunctionEnterDyn());
    }

    asyncFunctionAwaitUncaught(node: ts.Node, asynFuncObj: VReg, value: VReg) {
        this.add(node, new AsyncFunctionAwaitUncaughtDyn(asynFuncObj, value));
    }

    asyncFunctionResolve(node: ts.Node | NodeKind, asyncObj: VReg, value: VReg, canSuspend: VReg) {
        this.add(node, new AsyncFunctionResolveDyn(asyncObj, value, canSuspend));
    }

    asyncFunctionReject(node: ts.Node | NodeKind, asyncObj: VReg, value: VReg, canSuspend: VReg) {
        this.add(node, new AsyncFunctionRejectDyn(asyncObj, value, canSuspend));
    }

    getTemplateObject(node: ts.Node | NodeKind, value: VReg) {
        this.add(node, new GetTemplateObject(value));
    }

    copyRestArgs(node: ts.Node, index: number) {
        this.add(node, new CopyRestArgs(new Imm(ResultType.Int, index)));
    }

    getPropIterator(node: ts.Node) {
        this.add(node, getPropIterator());
    }

    getNextPropName(node: ts.Node, iter: VReg) {
        this.add(node, getNextPropName(iter));
    }

    createEmptyObject(node: ts.Node) {
        this.add(node, createEmptyObject());
    }

    createObjectHavingMethod(node: ts.Node, idx: number, env: VReg) {
        this.add(
            node,
            loadAccumulator(env),
            createObjectHavingMethod(idx)
        );
    }

    createObjectWithBuffer(node: ts.Node, idx: number) {
        this.add(node, createObjectWithBuffer(idx));
    }

    setObjectWithProto(node: ts.Node, proto: VReg, object: VReg) {
        this.add(node, setObjectWithProto(proto, object));
    }

    copyDataProperties(node: ts.Node, dstObj: VReg, srcObj: VReg) {
        this.add(node, copyDataProperties(dstObj, srcObj));
    }

    defineGetterSetterByValue(node: ts.Node, obj: VReg, name: VReg, getter: VReg, setter: VReg, isComputedPropertyName: boolean) {
        if (isComputedPropertyName) {
            this.add(node, loadAccumulator(getVregisterCache(this, CacheList.True)));
        } else {
            this.add(node, loadAccumulator(getVregisterCache(this, CacheList.False)));
        }
        this.add(node, defineGetterSetterByValue(obj, name, getter, setter));
    }

    createEmptyArray(node: ts.Node) {
        this.add(node, createEmptyArray());
    }

    createArrayWithBuffer(node: ts.Node, idx: number) {
        this.add(node, createArrayWithBuffer(idx));
    }

    storeArraySpreadElement(node: ts.Node, array: VReg, index: VReg) {
        this.add(node, storeArraySpread(array, index));
    }

    storeLexicalVar(node: ts.Node, level: number, slot: number, value: VReg) {
        this.add(
            node,
            storeLexicalVar(level, slot, value)
        );
    }

    loadLexicalVar(node: ts.Node, level: number, slot: number) {
        this.add(
            node,
            loadLexicalVar(level, slot)
        )
    }

    importModule(node: ts.Node, moduleName: string) {
        this.add(node, importModule(moduleName));
    }

    loadModuleVariable(node: ts.Node, module: VReg, varName: string) {
        this.add(node, loadModuleVarByName(varName, module));
    }

    storeModuleVar(node: ts.Node, moduleVarName: string) {
        this.add(node, storeModuleVariable(moduleVarName));
    }

    copyModule(node: ts.Node, module: VReg) {
        this.add(node, copyModuleIntoCurrentModule(module));
    }

    defineClassWithBuffer(node: ts.Node, name: string, idx: number, base: VReg) {
        this.add(
            node,
            defineClassWithBuffer(name, idx, getVregisterCache(this, CacheList.LexEnv), base)
        )
    }

    createObjectWithExcludedKeys(node: ts.Node, obj: VReg, args: VReg[]) {
        this.add(
            node,
            createObjectWithExcludedKeys(obj, args)
        );
    }

    throwObjectNonCoercible(node: ts.Node) {
        this.add(
            node,
            throwObjectNonCoercible()
        );
    }

    getIterator(node: ts.Node) {
        this.add(
            node,
            getIterator()
        );
    }

    getIteratorNext(node: ts.Node, iter: VReg, nextMethod: VReg) {
        this.add(
            node,
            getIteratorNext(iter, nextMethod)
        )
    }

    closeIterator(node: ts.Node, iter: VReg) {
        this.add(
            node,
            closeIterator(iter)
        )
    }

    throwIfNotObject(node: ts.Node, obj: VReg) {
        this.add(
            node,
            throwIfNotObject(obj)
        );
    }

    superCall(node: ts.Node, num: number, start: VReg) {
        this.add(
            node,
            superCall(num, start)
        )
    }

    superCallSpread(node: ts.Node, vs: VReg) {
        this.add(node, superCallSpread(vs));
    }

    ldSuperByName(node: ts.Node, obj: VReg, key: string) {
        this.add(
            node,
            ldSuperByName(obj, key)
        )
    }

    stSuperByName(node: ts.Node, obj: VReg, key: string) {
        this.add(
            node,
            stSuperByName(obj, key)
        )
    }

    ldSuperByValue(node: ts.Node, obj: VReg, prop: VReg) {
        this.add(
            node,
            ldSuperByValue(obj, prop)
        )
    }

    stSuperByValue(node: ts.Node, obj: VReg, prop: VReg) {
        this.add(
            node,
            stSuperByValue(obj, prop)
        )
    }

    loadSuperProperty(node: ts.Node, obj: VReg, prop: VReg | string | number) {
        switch (typeof (prop)) {
            case "string":
                this.ldSuperByName(node, obj, prop);
                break;
            case "number":
                let propReg = this.getTemp();
                this.loadAccumulatorInt(node, prop);
                this.storeAccumulator(node, propReg);
                this.ldSuperByValue(node, obj, propReg);
                this.freeTemps(propReg)
                break;
            default:
                this.ldSuperByValue(node, obj, prop);
        }
    }

    throwIfSuperNotCorrectCall(node: ts.Node, num: number) {
        this.add(node, throwIfSuperNotCorrectCall(num));
    }

    storeSuperProperty(node: ts.Node, obj: VReg, prop: VReg | string | number) {
        switch (typeof (prop)) {
            case "string":
                this.stSuperByName(node, obj, prop);
                break;
            case "number":
                let propReg = this.getTemp();
                this.loadAccumulatorInt(node, prop);
                this.storeAccumulator(node, propReg);
                this.stSuperByValue(node, obj, propReg);
                this.freeTemps(propReg)
                break;
            default:
                this.stSuperByValue(node, obj, prop);
        }
    }

    loadHomeObject(node: ts.Node) {
        this.add(
            node,
            loadHomeObject()
        )
    }

    private binaryRelation(node: ts.Node, op: BinaryOperator, lhs: VReg) {
        let falseLabel = new Label();
        let endLabel = new Label();
        switch (op) {
            case SyntaxKind.LessThanToken:
                this.add(node, new LessDyn(lhs));
                break;
            case SyntaxKind.GreaterThanToken:
                this.add(node, new GreaterDyn(lhs));
                break;
            case SyntaxKind.LessThanEqualsToken:
                this.add(node, new LessEqDyn(lhs));
                break;
            case SyntaxKind.GreaterThanEqualsToken:
                this.add(node, new GreaterEqDyn(lhs));
                break;
            case SyntaxKind.EqualsEqualsToken:
                this.add(node, new EqDyn(lhs));
                break;
            case SyntaxKind.ExclamationEqualsToken:
                this.add(node, new NotEqDyn(lhs));
                break;
            case SyntaxKind.EqualsEqualsEqualsToken:
                this.add(node, new StrictEqDyn(lhs));
                break;
            case SyntaxKind.ExclamationEqualsEqualsToken:
                this.add(node, new StrictNotEqDyn(lhs));
                break;
            default:
                throw new Error("unimplemented op");
        }
        this.add(node, new Jeqz(falseLabel));
        this.add(node, loadAccumulator(getVregisterCache(this, CacheList.True)));
        this.branch(node, endLabel);
        this.label(node, falseLabel);
        this.add(node, loadAccumulator(getVregisterCache(this, CacheList.False)));
        this.label(node, endLabel);
    }

    private add(node: ts.Node | NodeKind, ...insns: IRNode[]): void {
        // set pos debug info if debug mode
        DebugInfo.setDebuginfoForIns(node, ...insns);

        this.insns = this.insns.concat(insns);
    }
}
