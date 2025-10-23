export class GenericJSONExporter {
    export(data: any): string {
        // compact JSON as expected by tests
        return JSON.stringify(data);
    }
}