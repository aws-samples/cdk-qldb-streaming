import * as AWS from 'aws-sdk';
import * as qldb from 'amazon-qldb-driver-nodejs';
import * as lambda from 'aws-lambda';
import * as XRay from 'aws-xray-sdk';
import { createQldbTables } from './CreateTables';
//import { populateInitialData } from './InsertInitialDocuments';

// This Lambda needs to return result as the interface defined below which is requied by CDK Custom Resource 
// Provider as described in https://github.com/aws/aws-cdk/tree/master/packages/%40aws-cdk/custom-resources.
// 
// This Lambda conduct two activities:
//     1. Create required tables in QLDB Ledger. 
//     2. Populate initial data into QLDB tables. 
//
interface Result {
    readonly PhysicalResourceId?: string;
    readonly Data?: JSON;
}

XRay.captureAWS(AWS);

export async function onEvent(
    event: lambda.CloudFormationCustomResourceEvent, 
    context: lambda.Context,
): Promise<Result> {
    console.log(`Processing request: `, event);

    const qldbClientConfigOptions = {
        region: "ap-southeast-2",
    };

    const qldbDriver = new qldb.QldbDriver(event.ResourceProperties.LedgerName, qldbClientConfigOptions);

    let result = {};

    // set up logics for different Customer Resource events.
    try {
        if (event.RequestType === 'Create') {
            const props = JSON.stringify(event.ResourceProperties);
            console.log(`Create new resource with props ${props}`);
            result = await onCreate(event, qldbDriver);
        } else if (event.RequestType === 'Update') {
            const physicalId = event.PhysicalResourceId;
            const props = JSON.stringify(event.ResourceProperties);
            console.log(`Update resource ${physicalId} with props ${props}`);
            result = await onUpdate(event, qldbDriver);
        } else if (event.RequestType === 'Delete') {
            const physicalId = event.PhysicalResourceId;
            const props = JSON.stringify(event.ResourceProperties);
            console.log(`Delete resource ${physicalId} with props ${props}, but do not delete QLDB tables to avoid data loss`);
            result = await onDelete(event, qldbDriver);
        }
    } catch(e) {
        console.log(e);
        throw e;
    }

    return result;

};

export async function onCreate(
    event: lambda.CloudFormationCustomResourceEvent, 
    qldbDriver: qldb.QldbDriver,
): Promise<Result> {
    const ledgerName = event.ResourceProperties.LedgerName;
    const tableNameList = event.ResourceProperties.TableNameList;
    const customResourceId = event.ResourceProperties.CustomResourceId;

    await createQldbTables(qldbDriver, tableNameList);
    //await populateInitialData(qldbDriver);

    const physicalId = `${customResourceId}-${ledgerName}`;
    return {
        PhysicalResourceId: physicalId,
    };
};

export async function onUpdate(
    event: lambda.CloudFormationCustomResourceEvent, 
    qldbDriver: qldb.QldbDriver,
): Promise<Result> {
    const tableNameList = event.ResourceProperties.TableNameList;

    await createQldbTables(qldbDriver, tableNameList);
    //await populateInitialData(qldbDriver);

    return {};
};

export async function onDelete(
    event: lambda.CloudFormationCustomResourceEvent, 
    qldbDriver: qldb.QldbDriver,
): Promise<Result> {
    console.log('Do not delete the QLDB tables to avoid data loss');
    return {};
};