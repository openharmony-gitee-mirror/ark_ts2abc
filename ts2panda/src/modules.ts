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

import * as ts from "typescript";
import { PandaGen } from "./pandagen";
import jshelpers from "./jshelpers";
import { LocalVariable, ModuleVariable } from "./variable";
import { DiagnosticCode, DiagnosticError } from "./diagnostic";
import { ModuleScope } from "./scope";
import { Compiler } from "./compiler";

export class ModuleStmt {
    private node: ts.Node
    private moduleRequest: string;
    private namespace: string = "";
    private bingdingNameMap: Map<string, string> = new Map<string, string>();
    private isCopy: boolean = true;

    constructor(node: ts.Node, moduleRequest: string = "") {
        this.node = node;
        this.moduleRequest = moduleRequest;
    }

    getNode() {
        return this.node;
    }

    getModuleRequest() {
        return this.moduleRequest;
    }

    addLocalName(localName: string, importName: string) {
        if (this.bingdingNameMap.has(localName)) {
            throw new DiagnosticError(this.node, DiagnosticCode.Duplicate_identifier_0, jshelpers.getSourceFileOfNode(this.node), [localName]);
        }
        this.bingdingNameMap.set(localName, importName);
    }

    getBindingNameMap() {
        return this.bingdingNameMap;
    }

    setNameSpace(namespace: string) {
        this.namespace = namespace;
    }

    getNameSpace() {
        return this.namespace;
    }

    setCopyFlag(isCopy: boolean) {
        this.isCopy = isCopy;
    }

    getCopyFlag() {
        return this.isCopy;
    }
}

export function setImport(importStmts: Array<ModuleStmt>, moduleScope: ModuleScope, pandagen: PandaGen, compiler: Compiler) {
    importStmts.forEach((importStmt) => {
        pandagen.importModule(importStmt.getNode(), importStmt.getModuleRequest());
        let moduleReg = pandagen.allocLocalVreg();
        pandagen.storeAccumulator(importStmt.getNode(), moduleReg);

        if (importStmt.getNameSpace()) {
            let v = moduleScope.findLocal(importStmt.getNameSpace())!;
            pandagen.storeAccToLexEnv(importStmt.getNode(), moduleScope, 0, v, true);
            (<LocalVariable>v).initialize();
        }

        let bindingNameMap = importStmt.getBindingNameMap();
        bindingNameMap.forEach((value: string, key: string) => {
            let v = <ModuleVariable>moduleScope.findLocal(key)!;
            v.bindModuleVreg(moduleReg);
            v.setExoticName(value);
        });
    })
}

export function setExportBinding(exportStmts: Array<ModuleStmt>, moduleScope: ModuleScope, pandagen: PandaGen) {
    exportStmts.forEach((exportStmt) => {
        if (exportStmt.getModuleRequest()) {
            pandagen.importModule(exportStmt.getNode(), exportStmt.getModuleRequest());
            let moduleReg = pandagen.allocLocalVreg();
            pandagen.storeAccumulator(exportStmt.getNode(), moduleReg);

            if (!exportStmt.getCopyFlag()) {
                if (exportStmt.getNameSpace()) {
                    pandagen.storeModuleVar(exportStmt.getNode(), exportStmt.getNameSpace());
                }

                let bindingNameMap = exportStmt.getBindingNameMap();
                bindingNameMap.forEach((value: string, key: string) => {
                    pandagen.loadModuleVariable(exportStmt.getNode(), moduleReg, value);
                    pandagen.storeModuleVar(exportStmt.getNode(), key);
                });
            } else {
                pandagen.copyModule(exportStmt.getNode(), moduleReg);
            }
        } else {
            let bindingNameMap = exportStmt.getBindingNameMap();
            bindingNameMap.forEach((value: string, key: string) => {
                let v = moduleScope.findLocal(value);
                if (typeof v == 'undefined') {
                    throw new DiagnosticError(exportStmt.getNode(), DiagnosticCode.Cannot_export_0_Only_local_declarations_can_be_exported_from_a_module, jshelpers.getSourceFileOfNode(exportStmt.getNode()), [value]);
                }

                if (v instanceof ModuleVariable) {
                    pandagen.loadModuleVariable(exportStmt.getNode(), v.getModule(), v.getName());
                    pandagen.storeModuleVar(exportStmt.getNode(), key);
                } else {
                    (<LocalVariable>v).setExport();
                    (<LocalVariable>v).setExportedName(key);
                }
            });
        }
    })
}