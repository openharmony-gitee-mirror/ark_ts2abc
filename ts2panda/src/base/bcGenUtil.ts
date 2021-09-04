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
    Call0Dyn,
    Call1Dyn,
    Call2Dyn,
    Call3Dyn,
    CalliRangeDyn,
    CalliThisRangeDyn,
    CloseIterator,
    CopyDataProperties,
    CopyModule,
    CreateArrayWithBuffer,
    CreateEmptyArray,
    CreateEmptyObject,
    CreateObjectHavingMethod,
    CreateObjectWithBuffer,
    CreateObjectWithExcludedKeys,
    SetObjectWithProto,
    Debugger,
    DefineClassWithBuffer,
    DefineGetterSetterByValue,
    DelObjProp,
    FldaiDyn,
    GetIterator,
    GetIteratorNext,
    GetNextPropName,
    GetPropertiesIterator,
    Imm,
    ImportModule,
    IRNode,
    Jmp,
    Label,
    LdaDyn,
    LdaiDyn,
    LdaStr,
    LdGlobalVar,
    LdHomeObject,
    LdLexEnv,
    LdLexVar,
    LdModvarByName,
    LdObjByIndex,
    LdObjByName,
    LdObjByValue,
    LdSuperByName,
    LdSuperByValue,
    MovDyn,
    NewLexEnv,
    NewObjDynRange,
    PopLexEnv,
    ResultType,
    ReturnUndefined,
    StaDyn,
    StArraySpread,
    StGlobalVar,
    StLexVar,
    StModuleVar,
    StObjByIndex,
    StObjByName,
    StObjByValue,
    StOwnByIndex,
    StOwnByName,
    StOwnByValue,
    StSuperByName,
    StSuperByValue,
    SuperCall,
    SuperCallSpread,
    ThrowConstAssignment,
    ThrowDyn,
    ThrowDeleteSuperProperty,
    ThrowIfNotObject,
    ThrowIfSuperNotCorrectCall,
    ThrowPatternNonCoercible,
    ThrowThrowNotExists,
    ThrowUndefinedIfHole,
    TryLdGlobalByName,
    TryLdGlobalByValue,
    TryStGlobalByName,
    TryStGlobalByValue,
    VReg
} from "../irnodes";

export function loadAccumulatorInt(value: number): IRNode {
    return new LdaiDyn(new Imm(ResultType.Int, value));
}

export function loadAccumulatorFloat(value: number): IRNode {
    return new FldaiDyn(new Imm(ResultType.Float, value));
}

export function loadAccumulatorString(value: string): IRNode {
    return new LdaStr(value);
}

export function loadAccumulator(vreg: VReg): IRNode {
    return new LdaDyn(vreg);
}

export function storeAccumulator(vreg: VReg): IRNode {
    return new StaDyn(vreg);
}

export function deleteObjProperty(obj: VReg, prop: VReg): IRNode {
    return new DelObjProp(obj, prop);
}

export function moveVreg(vd: VReg, vs: VReg): IRNode {
    return new MovDyn(vd, vs);
}

export function jumpTarget(target: Label): IRNode {
    return new Jmp(target);
}

export function creatDebugger(): IRNode {
    return new Debugger();
}

export function throwException(): IRNode {
    return new ThrowDyn();
}

export function throwConstAssignment(name: VReg) {
    return new ThrowConstAssignment(name);
}

export function throwUndefinedIfHole(hole: VReg, name: VReg) {
    return new ThrowUndefinedIfHole(hole, name);
}

export function throwThrowNotExists() {
    return new ThrowThrowNotExists();
}

export function throwDeleteSuperProperty() {
    return new ThrowDeleteSuperProperty();
}

export function newLexicalEnv(numVars: number) {
    return new NewLexEnv(new Imm(ResultType.Int, numVars));
}

export function loadLexicalEnv() {
    return new LdLexEnv();
}

export function popLexicalEnv() {
    return new PopLexEnv();
}

export function loadLexicalVar(level: number, slot: number) {
    return new LdLexVar(new Imm(ResultType.Int, level), new Imm(ResultType.Int, slot));
}

export function storeLexicalVar(level: number, slot: number, value: VReg) {
    return new StLexVar(new Imm(ResultType.Int, level), new Imm(ResultType.Int, slot), value);
}

export function tryLoadGlobalByName(key: string) {
    return new TryLdGlobalByName(key);
}

export function tryStoreGlobalByName(key: string) {
    return new TryStGlobalByName(key);
}

export function tryLoadGlobalByValue(key: VReg) {
    return new TryLdGlobalByValue(key);
}

export function tryStoreGlobalByValue(prop: VReg): IRNode {
    return new TryStGlobalByValue(prop);
}

export function loadGlobalVar(name: string) {
    return new LdGlobalVar(name);
}

export function storeGlobalVar(name: string) {
    return new StGlobalVar(name);
}

export function loadObjByName(obj: VReg, key: string) {
    return new LdObjByName(key, obj);
}

export function storeObjByName(obj: VReg, key: string) {
    return new StObjByName(key, obj);
}

export function loadObjByIndex(obj: VReg, index: VReg) {
    return new LdObjByIndex(obj, index);
}

export function storeObjByIndex(obj: VReg, index: VReg) {
    return new StObjByIndex(obj, index);
}

export function loadObjByValue(obj: VReg, prop: VReg): IRNode {
    return new LdObjByValue(obj, prop);
}

export function storeObjByValue(obj: VReg, prop: VReg): IRNode {
    return new StObjByValue(obj, prop);
}

export function storeOwnByName(obj: VReg, key: string): IRNode {
    return new StOwnByName(key, obj);
}

export function storeOwnByIndex(obj: VReg, index: VReg) {
    return new StOwnByIndex(obj, index);
}

export function storeOwnByValue(obj: VReg, value: VReg) {
    return new StOwnByValue(obj, value);
}

export function throwIfSuperNotCorrectCall(num: number) {
    return new ThrowIfSuperNotCorrectCall(new Imm(ResultType.Int, num));
}

export function call(args: VReg[], passThis: boolean) {
    let length = args.length;
    let insn: IRNode;
    if (!passThis) {
        switch (length) {
            case 1:
                insn = new Call0Dyn(args[0]);
                break;
            case 2:
                insn = new Call1Dyn(args[0], args[1]);
                break;
            case 3:
                insn = new Call2Dyn(args[0], args[1], args[2]);
                break;
            case 4:
                insn = new Call3Dyn(args[0], args[1], args[2], args[3]);
                break;
            default:
                insn = new CalliRangeDyn(new Imm(ResultType.Int, length - 1), args);
        }
    } else {
        insn = new CalliThisRangeDyn(new Imm(ResultType.Int, length - 1), args);
    }

    return insn;
}

export function newObject(args: VReg[]) {
    return new NewObjDynRange(new Imm(ResultType.Int, args.length), args);
}

export function getPropIterator() {
    return new GetPropertiesIterator();
}

export function getNextPropName(iter: VReg) {
    return new GetNextPropName(iter);
}

export function returnUndefined() {
    return new ReturnUndefined();
}

export function createEmptyObject() {
    return new CreateEmptyObject();
}

export function createObjectHavingMethod(idx: number) {
    return new CreateObjectHavingMethod(new Imm(ResultType.Int, idx));
}

export function createObjectWithBuffer(idx: number) {
    return new CreateObjectWithBuffer(new Imm(ResultType.Int, idx));
}

export function setObjectWithProto(proto: VReg, object: VReg) {
    return new SetObjectWithProto(proto, object);
}

export function copyDataProperties(dstObj: VReg, srcObj: VReg) {
    return new CopyDataProperties(dstObj, srcObj);
}

export function defineGetterSetterByValue(obj: VReg, name: VReg, getter: VReg, setter: VReg) {
    return new DefineGetterSetterByValue(obj, name, getter, setter);
}

export function createEmptyArray() {
    return new CreateEmptyArray();
}

export function createArrayWithBuffer(idx: number) {
    return new CreateArrayWithBuffer(new Imm(ResultType.Int, idx));
}

export function storeArraySpread(array: VReg, index: VReg) {
    return new StArraySpread(array, index);
}

export function defineClassWithBuffer(id: string, idx: number, env: VReg, base: VReg) {
    return new DefineClassWithBuffer(id, new Imm(ResultType.Int, idx), env, base);
}

export function createObjectWithExcludedKeys(obj: VReg, args: VReg[]) {
    return new CreateObjectWithExcludedKeys(new Imm(ResultType.Int, args.length - 1), obj, args);
}

export function throwObjectNonCoercible() {
    return new ThrowPatternNonCoercible();
}

export function throwIfNotObject(v: VReg) {
    return new ThrowIfNotObject(v);
}

export function getIterator() {
    return new GetIterator();
}

export function getIteratorNext(iter: VReg, nextMethod: VReg) {
    return new GetIteratorNext(iter, nextMethod);
}

export function closeIterator(iter: VReg) {
    return new CloseIterator(iter);
}

export function superCall(num: number, start: VReg) {
    return new SuperCall(new Imm(ResultType.Int, num), start);
}

export function superCallSpread(vs: VReg) {
    return new SuperCallSpread(vs);
}

export function ldSuperByName(obj: VReg, key: string) {
    return new LdSuperByName(key, obj);
}

export function stSuperByName(obj: VReg, key: string) {
    return new StSuperByName(key, obj);
}

export function stSuperByValue(obj: VReg, prop: VReg) {
    return new StSuperByValue(obj, prop);
}

export function ldSuperByValue(obj: VReg, prop: VReg): IRNode {
    return new LdSuperByValue(obj, prop);
}

export function importModule(name: string) {
    return new ImportModule(name);
}

export function loadModuleVarByName(name: string, module: VReg) {
    return new LdModvarByName(name, module);
}

export function storeModuleVariable(name: string) {
    return new StModuleVar(name);
}

export function copyModuleIntoCurrentModule(mod: VReg) {
    return new CopyModule(mod);
}

export function loadHomeObject() {
    return new LdHomeObject();
}
