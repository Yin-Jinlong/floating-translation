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
            <label style="font-weight: 900">当前字典：</label>
            <el-dropdown>
                <span class="el-dropdown-link">
                {{ nowDict }}<el-icon class="el-icon--right"><arrow-down/></el-icon>
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item>default</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
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
import {Config, DefaultConfig, Message, sendMessage} from "@/Message.ts";
import {ArrowDown} from "@element-plus/icons-vue";

const nowPane = ref<'card' | 'dict'>('card')
const nowDict = ref<string>('default')

let data = reactive<Config>({
    cardColor: DefaultConfig.cardColor,
    fontColor: DefaultConfig.fontColor,
    showShadow: DefaultConfig.showShadow
})

function sendCard() {
    chrome.runtime.sendMessage({
        type: 'client',
        content: 'card-color',
        data: data.cardColor
    } as Message<string>)
}

function sendFont() {
    chrome.runtime.sendMessage({
        content: 'font-color',
        data: data.fontColor
    } as Message<string>)
}

function sendShowShadow() {
    chrome.runtime.sendMessage({
        content: 'show-shadow',
        data: data.showShadow
    } as Message<boolean>)
}

function clear() {
    sendMessage({
        content: 'clear'
    } as Message<void>)
    Object.assign(data, DefaultConfig)
}

onMounted(() => {
    sendMessage({
        content: 'get-config'
    } as Message<void>, (config: Config) => {
        Object.assign(data, config)
    })
})

</script>
