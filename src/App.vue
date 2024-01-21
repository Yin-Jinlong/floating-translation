<template>
    <el-form style="width: calc(100% - 2em)" v-model="data">

    </el-form>
    <span>abandon</span>
    <br>
    <span>about</span>
</template>

<style lang="scss" scoped>

</style>

<script lang="ts" setup>

import {reactive} from "vue";

let data = reactive({
    word: '',
    value: ''
})

</script>
