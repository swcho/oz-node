// https://www.npmjs.org/package/jenkins-api

declare module "jenkins-api" {
    export interface JenkinsApi {
        build(jobname: string, callback, params?);
        all_jobs(callback);
        job_info(jobname, callback);
        last_build_info(jobname, callback);
        last_completed_build_info(jobname, callback);
        build_info(jobname, number, callback);
        last_build_report(jobname, callback);
        get_config_xml(jobname, callback);
        create_job(jobname, job_config, callback);
        copy_job(jobname, new_job, modifyfunction, callback);
        delete_job(jobname, callback);
        last_success(jobname, callback);
        last_result(jobname, callback);
        job_output(jobname, buildname, callback);
    }
    export function init(aUrl: string): JenkinsApi;
}