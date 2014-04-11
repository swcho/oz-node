// https://www.npmjs.org/package/jenkins


interface JenkinsNodeInfo {
    actions: any[];
    displayName: string;
    executors: any[];
    icon: string;
    idle: boolean;
    jnlpAgent: boolean;
    launchSupported: boolean;
    loadStatistics: any;
    manualLaunchAllowed: boolean;
    monitorData: any[];
    numExecutors: number;
    offline: boolean;
    offlineCause: any;
    offlineCauseReason: string;
    oneOffExecutors: any[];
    temporarilyOffline: boolean
}

interface JenkinsNodeListInfo {
    busyExecutors: number;
    displayName: string;
    totalExecutors: number;
    computer: JenkinsNodeInfo[];
}

interface JenkinsNodeCreateParam {
    nodeDescription: string;
    numExecutors?: number;
    remoteFS: string;
    labelString: string;
    exclusive?: boolean;
    retentionStrategy?: any;
    nodeProperties?: any;
    launcher?: any;
}

/*
 {
 name: name,
 nodeDescription: opts.nodeDescription,
 numExecutors: opts.hasOwnProperty('numExecutors') ? opts.numExecutors : 2,
 remoteFS: opts.remoteFS || '/var/lib/jenkins',
 labelString: opts.labelString,
 mode: opts.exclusive ? 'EXCLUSIVE' : 'NORMAL',
 type: o.qs.type,
 retentionStrategy: opts.retentionStrategy || {'stapler-class': 'hudson.slaves.RetentionStrategy$Always'},
 nodeProperties: opts.nodeProperties || {'stapler-class-bag': 'true'},
 launcher: opts.launcher || {'stapler-class': 'hudson.slaves.JNLPLauncher'},
 }
 */


declare module "jenkins" {
    module j {
        interface BuildApi {
            get(name, number, opts, callback);
            get(name, number, callback);
            stop(name, number, callback);
        }

        interface JobApi {
            build(name, opts, callback);
            build(name, callback);
            config(name, callback);
            config(name, xml, callback);
            copy(srcName, dstName, callback);
            create(name, xml, callback);
            delete(name, callback);
            disable(name, callback);
            enable(name, callback);
            exists(name, callback);
            get(name, opts, callback);
            get(name, callback);
            list(callback);
        }

        interface NodeApi {
            create(name, opts: JenkinsNodeCreateParam, callback);
            create(name, callback);
            delete(name, callback);
            disable(name, message, callback);
            disable(name, callback);
            enable(name, callback);
            exists(name, callback);
            get(name, callback);
            list(callback: (err, list: JenkinsNodeListInfo) => void);
        }

        interface QueueApi {
            get(opts, callback);
            get(callback);
            cancel(number, callback);
        }

        export interface JenkinsApi {
            get(callback);
            build: BuildApi;
            job: JobApi;
            node: NodeApi;
            queue: QueueApi;
        }
    }
    function j(aUrl: string):j.JenkinsApi;
    export = j;
}