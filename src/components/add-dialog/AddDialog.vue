<template>
    <el-dialog :model-value="modelValue"
               align-center
               style="width: 90%;overflow:hidden;height: 80%"
               @close="$emit('update:modelValue',false)"
               @open="$emit('update:modelValue',true)">
        <template #title>
            <h3>添加字典（未实现）</h3>
        </template>
        <template #default>
            <el-scrollbar>
                <div style="display:flex;align-items: center;justify-content: space-between">
                    <div style="flex: 10%;padding-right: 0.5em;text-align: right">名字</div>
                    <el-input
                            v-model="dictName"
                            style="flex: 80%;width: 100%"/>
                </div>
                <el-upload
                        :before-upload="beforeLoad"
                        :show-file-list="false"
                        class="upload"
                        drag
                        multiple>
                    <el-icon class="el-icon--upload">
                        <upload-filled/>
                    </el-icon>
                    <div class="el-upload__text">
                        拖拽文件或<em>点击上传</em>
                    </div>
                    <template #tip>
                        <div class="el-upload__tip">
                            json files
                        </div>
                    </template>
                </el-upload>
                <div style="width:95%;margin: 0 auto">
                    <el-button style="width: 100%;">确定</el-button>
                </div>
            </el-scrollbar>
        </template>
    </el-dialog>
</template>

<style lang="scss" scoped>
.upload {
  width : 100%;
}
</style>
<script lang="ts" setup>

import {ref} from 'vue'
import {AddDialogProps} from ".";
import {UploadFilled} from "@element-plus/icons-vue";

defineProps<AddDialogProps>()
defineEmits(['update:modelValue'])

const dictName = ref<string>('')

function beforeLoad() {

    return false
}

</script>
