<template>
    <el-form
            v-model="data"
            label-width="80px"
            style="width: calc(100% - 2em)">
        <el-form-item label="背景色">
            <el-color-picker v-model="data.cardColor" show-alpha @change="sendCard"/>
        </el-form-item>
        <el-form-item label="字体颜色">
            <el-color-picker v-model="data.fontColor" show-alpha @change="sendFont"/>
        </el-form-item>
        <div>
            <el-button type="danger" @click="clear">重置</el-button>
        </div>
    </el-form>
</template>

<style lang="scss" scoped>

</style>

<script lang="ts" setup>

import {onMounted, reactive} from "vue";
import {Config, Message} from "@/Message.ts";

let data = reactive({
    cardColor: 'hsl(22, 68%, 90%)',
    fontColor: 'hsl(0,0%,10%)'
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

function clear() {
    chrome.runtime.sendMessage({
        content: 'clear'
    } as Message<void>)
    data.cardColor = 'hsl(22, 68%, 90%)'
    data.fontColor = 'hsl(0,0%,10%)'
}

onMounted(() => {
    chrome.storage.sync.get('config', (res: { config: Config } | any) => {
        if (res?.config?.fontColor)
            data.fontColor = res.config.fontColor
        if (res?.config?.cardColor)
            data.cardColor = res.config.cardColor
    })
})

</script>
