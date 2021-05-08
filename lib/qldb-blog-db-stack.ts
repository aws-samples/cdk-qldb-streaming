/*

Description:

This CDK Stack creates two QLDB ledgers:
    i. QldbBlog
    ii. QldbBlogStreaming
    
Please note currently CDK only supports raw CFN resource class to create QLDB ledger. There is no high-level abstract CDK construct class yet.

Then the CDK stack in qldb-blog-db-stack.ts will create streaming and Lambda to set up the data replications between these two QLDB ledgers.

*/

import * as cdk from '@aws-cdk/core';
import * as qldb from '@aws-cdk/aws-qldb';


interface QldbBlogDbStackProps extends cdk.StackProps {
    readonly qldbLedgerName: string;
    readonly destQldbLedgerName: string;
}

export class QldbBlogDbStack extends cdk.Stack {
    public readonly qldbLedger: qldb.CfnLedger;
    public readonly qldbLedgerStreaming: qldb.CfnLedger;

    constructor(scope: cdk.Construct, id: string, props: QldbBlogDbStackProps) {

        super(scope, id, props);

        // Create source QLDB Ledger. Please note in production, we normally would set deletionProtection to true in the lines below.
        this.qldbLedger = new qldb.CfnLedger(this, 'QldbBlogLedger', {
            name: props.qldbLedgerName,
            permissionsMode: 'ALLOW_ALL',
        });

        // Create the destination QLDB instance. 
        this.qldbLedgerStreaming = new qldb.CfnLedger(this, 'QldbBlogLedgerStreaming', {
            name: props.destQldbLedgerName,
            permissionsMode: 'ALLOW_ALL',
        });

        // Create CloudFormation output. 
        new cdk.CfnOutput(this, 'QldbLedgerId', {
            value: this.qldbLedger.ref,
            description: 'Qldb Ledger ID',
        });

        new cdk.CfnOutput(this, 'QldbLedgerStreamingId', {
            value: this.qldbLedgerStreaming.ref,
            description: 'Destination Qldb Ledger ID',
        });

    };
}

