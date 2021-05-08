import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as QldbBlog from '../lib/qldb-blog-stream-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new QldbBlog.QldbBlogStreamStack(app, 'MyTestStack', {
      qldbLedgerName: "QldbBlog", 
      destQldbLedgerName: "QldbBlogStreaming",
      tableNameList: "VehicleRegistration, Vehicle, Person, DriversLicense",
      kdsKmsAlias: "alias/qldb-streaming/kds-key",
      s3KmsAlias: "alias/qldb-streaming/s3-key",
    });
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
