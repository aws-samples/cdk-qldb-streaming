/*

Description: 

The construct is a custom resource to create QLDB tables and populate the table contents which
are not supported by CDK OOTB. 

*/

import * as cdk from "@aws-cdk/core";
import * as lambda from '@aws-cdk/aws-lambda';
import * as cr from '@aws-cdk/custom-resources';
import * as iam from '@aws-cdk/aws-iam';
import * as path from 'path';

export interface CrForProvQldbTablesProps {
    readonly ledgerName: string;
    readonly tableNameList: string;
    readonly customResourceId: string;
    readonly description: string;
}

export class CrForProvQldbTables extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, props: CrForProvQldbTablesProps) {
        super(scope, id);

        // Set up signleton - i.e. make sure there is only one instance of QldbTablesProvider existing in the stack. 
        const stack = cdk.Stack.of(this);
        const uid = 'ProvisionQldbTablesProvider';
        const myProvider = stack.node.tryFindChild(uid) as QldbTablesProvider || new QldbTablesProvider(stack, uid);

        new cdk.CustomResource(this, 'Resoure', {
            resourceType: 'Custom::CrForProvQldbTables',
            properties: {
                LedgerName: props.ledgerName,
                TableNameList: props.tableNameList,
                CustomResourceId: props.customResourceId,
                Description: props.description 
            },
            serviceToken: myProvider.provider.serviceToken
        });
    }
}

class QldbTablesProvider extends cdk.Construct {

    public readonly provider: cr.Provider;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        const providerLambdaFn = new lambda.Function(this, 'HandlerLambda', {
            handler: 'index.onEvent',
            runtime: lambda.Runtime.NODEJS_12_X,
            code: lambda.Code.fromAsset(path.join(__dirname, './lambda/createQldbTables/output')),
            timeout: cdk.Duration.minutes(5),
            tracing: lambda.Tracing.ACTIVE
        });

        // Assign QLDB ledger access to custom resource provider Lambda so that it can create tables and populate initial data
        // into tables. 
        const lambdaFunctionPolicyStmQldb = new iam.PolicyStatement();
        lambdaFunctionPolicyStmQldb.addActions(
            //  Allows the Lambda function to access QLDB ledger
            "qldb:UpdateLedger",
            "qldb:List*",
            "qldb:Describe*",
            "qldb:Get*",
            "qldb:TagResource",
            "qldb:UntagResource",
            "qldb:SendCommand"
        );
        lambdaFunctionPolicyStmQldb.addAllResources();
        providerLambdaFn.addToRolePolicy(lambdaFunctionPolicyStmQldb);

        this.provider = new cr.Provider(this, 'Provider', {
            onEventHandler: providerLambdaFn
        });

    };
}