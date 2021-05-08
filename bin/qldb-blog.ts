#!/usr/bin/env node
// import { BaseStack } from './base-stack';
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { QldbBlogDbStack } from '../lib/qldb-blog-db-stack';
import { QldbBlogStreamStack } from '../lib/qldb-blog-stream-stack';

const app = new cdk.App();

// Retrieve current env & QLDB ledger name
const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
};
const qldbLedgerName = app.node.tryGetContext('qldbLedgerName');
const destQldbLedgerName = app.node.tryGetContext('destQldbLedgerName');
const tableNameList = app.node.tryGetContext('tableNameList');
const kdsKmsAlias = app.node.tryGetContext('kdsKmsAlias');
const s3KmsAlias = app.node.tryGetContext('s3KmsAlias');

// First we use QldbBlogDbStack to create both source and destination QLDB Ledgers.
const qldbBlogDbStack = new QldbBlogDbStack(app, 'QldbBlogDbStack', {
    env,
    qldbLedgerName,
    destQldbLedgerName,
});

// Now we use QldbBlogStreamStack to deploy the stream settings & PartiQL replay Lambda in between the source & destination QLDB ledgers.
new QldbBlogStreamStack(app, 'QldbBlogStreamStack', {
    env,
    qldbLedgerName: qldbBlogDbStack.qldbLedger.name!,
    destQldbLedgerName: qldbBlogDbStack.qldbLedgerStreaming.name!,
    tableNameList,
    kdsKmsAlias,
    s3KmsAlias
});
