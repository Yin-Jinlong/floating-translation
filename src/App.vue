<template>
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
</template>

<style lang="scss" scoped>

</style>

<script lang="ts" setup>

import {onMounted, reactive} from "vue";
import {Config, DefaultConfig, Message} from "@/Message.ts";

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
    chrome.runtime.sendMessage({
        content: 'clear'
    } as Message<void>)
    Object.assign(data, DefaultConfig)
}

onMounted(() => {
    chrome.storage.sync.get('config', (res: { config: Config } | any) => {
        Object.assign(data, res.config)
    })
})

</script>
