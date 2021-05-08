#!/usr/bin/env node

/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

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
