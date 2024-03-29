import { Injectable, Inject } from '@nestjs/common';
import { NormalSuccessResponse, DeleteMultiResult } from 'ali-oss';
import { OSS_CONST, OSS_OPTIONS, OSS_STS, OSSModuleOptions } from './oss.provider';
import { OSSBase, UploadResult, File } from './oss.base';
import stream from 'stream';
import OSS from 'ali-oss';
// import { threadpool } from '../lib/src/oss.works.js';
// import { threadpool } from './oss.works';

/**
 * OSS
 * @export
 * @class OSSService
 */
@Injectable()
export class OSSService extends OSSBase {
    constructor(
        @Inject(OSS_STS) public readonly ossSts: OSS.STS,
        @Inject(OSS_CONST) protected readonly ossClient: OSS,
        @Inject(OSS_OPTIONS) protected readonly options: OSSModuleOptions
    ) {
        super();
        // if (this.version >= 11.7 && this.options.multi) {
        //     threadpool.mainThread(this.options);
        // }
    }

    /**
     * 流式下载
     * @param target 
     */
    public async getStream(target: string): Promise<OSS.GetStreamResult>{

        return await this.ossClient.getStream(target);
    }

    /**
     * 删除
     * @param target 
     */
    public async delete(target: string): Promise<NormalSuccessResponse> {

        return await this.ossClient.delete(target);
    }

    /**
     * 批量删除
     * @param target 
     */
    public async deleteMulti(targets: string[]): Promise<DeleteMultiResult> {

        return await this.ossClient.deleteMulti(targets);
    }

    /**
     * 上传
     * @param target
     * @param imageStream
     */
    public async uploadAsStream(target: string, imageStream: stream.PassThrough) {
        return await this.putStream(target, imageStream);
    }

    /**
     * 上传
     * @param file
     */
    public async upload(files: File[]): Promise<UploadResult[]> {
        //if (this.version >= 11.7 && this.options.multi) {
        //    return await this.uploadOSSMuit(files);
        //} else {
            return await this.uploadOSS(files);
       //}
    }

    /**
     * 上传到OSS(多线程并行上传)
     * @param file
     */
    // private async uploadOSSMuit(files: File[]): Promise<UploadResult[]> {
    //     const result: UploadResult[] = await threadpool.sendData(files);

    //     return result;
    // }

    /**
     * 结束上传进程(仅作为单元测试结束调用)
     */
    // public endThread() {
    //     threadpool.endThread();
    // }
}
