<template>
    <el-form style="width: calc(100% - 2em)" v-model="data">
        敬请期待
    </el-form>
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
