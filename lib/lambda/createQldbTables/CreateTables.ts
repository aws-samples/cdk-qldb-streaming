import * as qldb from 'amazon-qldb-driver-nodejs';

// This file include the logics of creating QLDB tables required in QDLB ledger as part of the deployment process. 
// The list of those table names are carried in from the CDK codes in bin/qldb-blog.ts. 

/**
 * Create QLDB tables required in QDLB ledger.
 * @param qldbDriver The QLDB driver initialized in the Lambda entry file index.ts.
 * @param tableNameList List of names of tables to be created in QLDB. 
 * @returns Promise which fulfills with void.
 */
export async function createQldbTables(
    qldbDriver: qldb.QldbDriver,
    tableNameList: string,
): Promise<void> {

    const existingTableNames = await qldbDriver.getTableNames();
    const existingTableNamesLc = existingTableNames.map( e => e.toLowerCase() );
    console.log(`Existing table names with lowercase are ${existingTableNamesLc}`);

    const tableList = tableNameList.split(',').map(e => e.trim());
    
    const tablesToCreate = tableList.filter( e => {return !existingTableNamesLc.includes(e.toLowerCase())} );

    console.log(`Tables to be created are ${tablesToCreate}`)

    if(tablesToCreate.length > 0)
    {
        try {
            await qldbDriver.executeLambda(async (txn: qldb.TransactionExecutor) => {
                Promise.all(tablesToCreate.map( (table: string) => {
                    createTable(txn, table);
                }));
            });
        } catch (e) {
            console.log(`Unable to create tables: ${e}`);
        }
        
    } else {
        console.log('All required tables are existing in QLDB ledger, no more table to be created')
    }

};

/**
 * Create QLDB table.
 * @param txn The {@linkcode TransactionExecutor} for lambda execute.
 * @param tableName Name of the table to be created.
 * @returns Promise which fulfills with a number.
 */
async function createTable(txn: qldb.TransactionExecutor, tableName: string): Promise<number> {
    const statement: string = `CREATE TABLE ${tableName}`;
    return await txn.execute(statement).then((result: qldb.Result) => {
        console.log(`Successfully created table ${tableName}.`);
        return result.getResultList().length;
    });
}