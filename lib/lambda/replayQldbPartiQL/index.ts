import * as AWS from 'aws-sdk';
import * as qldb from 'amazon-qldb-driver-nodejs';
import * as lambda from 'aws-lambda';
import * as XRay from 'aws-xray-sdk';
import * as ion from 'ion-js';

XRay.captureAWS(AWS);

export async function onEvent(
    event: lambda.KinesisStreamEvent, 
    context: lambda.Context,
): Promise<void> {

    console.log(`Processing request: `, event);

    const aws_region = process.env.AWS_REGION;
    const destQdlbName = process.env.destQldbName;

    const qldbClientConfigOptions = {
        region: aws_region,
    };

    const qldbDriver = new qldb.QldbDriver(destQdlbName!, qldbClientConfigOptions);

    try {
        for (const record of event.Records) {
            const payload: lambda.KinesisStreamRecordPayload = record.kinesis;

            // Load the message as ION record. 
            const ion_record = ion.load(Buffer.from(payload.data, 'base64'));
    
            // if not ION record or not BLOCK_SUMMARY record type, skip this record. 
            if (ion_record === null || 
                ion_record.get('recordType')?.stringValue() as string !== 'BLOCK_SUMMARY') 
                continue;

            const ion_text = ion.dumpText(ion_record);

            console.log(
                `Kinesis Message:
                partition key: ${payload.partitionKey}
                sequence number: ${payload.sequenceNumber}
                kinesis schema version: ${payload.kinesisSchemaVersion}
                data: ${ion_text}
            `);

            // Now we extract each of the PartiQL statement. 
            // It's full json path is .payload.transactionInfo.statements[].statement
            const partiql_statements = ion_record.get('payload', 'transactionInfo', 'statements')
            
            for (const statement_element of partiql_statements!.elements()) {
                const statement_string = statement_element.get('statement')?.stringValue();
                if(statement_string!.toLowerCase().startsWith('select')) {
                    console.log('Ingore SELECT statement');
                    continue;
                }
                console.log(`The current PartiQL statement is ${statement_string}`);
                await qldbDriver.executeLambda(async (txn: qldb.TransactionExecutor) => {
                    Promise.all([
                        executeStatement(txn, statement_string!),
                    ]);
                });
            }

        }
    } catch (error) {
        console.log(error);
    }

};

export async function executeStatement(txn: qldb.TransactionExecutor, statement_string: string): Promise<number> {
    return await txn.execute(statement_string).then((result: qldb.Result) => {
        console.log(`Successfully executed the statement of ${statement_string}.`);
        return result.getResultList().length;
    });
}