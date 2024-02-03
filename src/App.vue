<template>
    <el-tabs v-model="nowPane">
        <el-tab-pane label="卡片设置" name="card">
            <el-form
                    v-model="data"
                    label-width="80px"
                    style="width: calc(100% - 2em)">
                <h3>悬浮卡片</h3>
                <el-form-item label="背景色">
                    <el-color-picker
                            v-model="data.cardColor"
                            show-alpha
                            @change="sendCard"/>
                </el-form-item>
                <el-form-item label="字体颜色">
                    <el-color-picker v-model="data.fontColor"
                                     show-alpha
                                     @change="sendFont"/>
                </el-form-item>
                <el-form-item label="显示阴影">
                    <el-switch v-model="data.showShadow" @change="sendShowShadow"/>
                </el-form-item>
            </el-form>
            <div>
                <el-button type="danger" @click="clear">重置</el-button>
            </div>
        </el-tab-pane>
        <el-tab-pane label="字典" name="dict">
            <div style="display:flex;align-items: center">
                <label style="font-weight: 900">当前字典：</label>
                <el-dropdown trigger="click" @command="changeDict">
                <span class="el-dropdown-link">
                {{ nowDict }}<el-icon class="el-icon--right"><arrow-down/></el-icon>
                </span>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item v-if="dictNames.length===0">default</el-dropdown-item>
                            <el-dropdown-item
                                    v-for="i in dictNames"
                                    v-else
                                    :command="i.name">{{ i.name }}
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
                <el-button
                        plain
                        text
                        @click="loadDicts()">
                    <el-icon>
                        <RefreshRight/>
                    </el-icon>
                </el-button>
            </div>
            <el-table
                    v-loading="loading"
                    :data="dictNames"
                    element-loading-text="获取字典中..."
                    stripe
                    style="position: relative;min-height: 100px">
                <el-table-column label="字典名字" prop="name"/>
                <el-table-column label="单词数量" prop="count"/>
                <el-table-column fixed="right" label="操作">
                    <template #default="item">
                        <el-button
                                :disabled="dictNames[item.$index]?.name=='default'"
                                plain
                                text
                                type="danger">
                            <el-icon>
                                <Delete/>
                            </el-icon>
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div style="margin: 1em auto;width: 95%">
                <el-button style="width: 100%;" @click="showAddDialog=true">
                    <el-icon>
                        <Plus/>
                    </el-icon>
                </el-button>
                <AddDialog v-model="showAddDialog"/>
            </div>
        </el-tab-pane>
    </el-tabs>
</template>

<style lang="scss" scoped>
.el-dropdown-link {
  cursor      : pointer;
  color       : var(--el-color-primary);
  display     : flex;
  align-items : center;
}
</style>

<script lang="ts" setup>

import {onMounted, reactive, ref} from "vue";
import {Config, DefaultConfig, sendMessage, sendMessageData} from "@/Message.ts";
import {ArrowDown, Delete, Plus, RefreshRight} from "@element-plus/icons-vue";
import {DictNameWithCount} from "@/Dict.ts";
import {ElMessage} from "element-plus";
import {AddDialog} from "@/components/add-dialog";

const nowPane       = ref<'card' | 'dict'>('card')
const nowDict       = ref<string>('default')
const showAddDialog = ref<boolean>(false)
const loading       = ref<boolean>(false)

let data = reactive<Config>({
    cardColor: DefaultConfig.cardColor,
    fontColor: DefaultConfig.fontColor,
    showShadow: DefaultConfig.showShadow
})

let dictNames = reactive<DictNameWithCount[]>([])

function debounce(func: Function, wait: number = 300, immediateFn?: Function) {
    let timeoutId: ReturnType<typeof setTimeout>
    return (...args: any[]) => {
        if (immediateFn)
            immediateFn()
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
            func(...args)
        }, wait)
    }
}

function sendCard() {
    sendMessageData('card-color', data.cardColor)
}

function sendFont() {
    sendMessageData('font-color', data.fontColor)
}

function sendShowShadow() {
    sendMessageData('show-shadow', data.showShadow)
}

function clear() {
    sendMessage('clear')
    Object.assign(data, DefaultConfig)
}

const loadDicts: () => void = debounce(() => {
    sendMessage('get-dicts', (dicts: DictNameWithCount[]) => {
        dictNames     = dicts
        loading.value = false
    })
}, 300, () => {
    loading.value = true
})

function changeDict(name: string) {
    sendMessageData('load-dict', name, (ok: boolean) => {
        if (ok) {
            ElMessage.success('加载成功')
        } else {
            ElMessage.error('加载失败')
        }
    })
}

onMounted(() => {
    sendMessage('get-config', (config: Config) => {
        Object.assign(data, config)
    })
    loadDicts()
})

</script>
