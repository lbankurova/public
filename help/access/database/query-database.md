# Query a database

Database queries are regular SQL queries that are executed within a given connection. 

1. Right-click on a database connection you want to query and select **Add query...**.
2. Type a SQL query in the query field and click the "Run query" (![run query](/help/images/run-query.png)) button. 

   ![Database query](/help/images/access/database-query.gif)

   When the query is executed, the results are displayed below the query field. 

3. Optionally, give your query a name and click **Save** to save the query for later use.

## Query metadata

You can define query metadata, input and output parameters for a query. 


## Parameterized queries 

A parameterized query is a query with one or more input parameters. 
When you execute a parameterized query from the Datagrok UI, it prompts you to provide values for the parameters.  
Each input parameter is presented as an input field.

Query input parameters can have default values, be represented as multiple-choice options, include results from another query, etc. 
For advanced use cases and in-depth examples, refer to the [Scripting](/help/compute/scripting) section.

Query parameters are defined as comments before the query text, in the following format:

```sql
--input: <type> <name> {= <value>} {<option>: <value>; ...} [<description>] 
```

|  Parameter         |  Description             |
|-----------|--------------------------|
| `<type>`     |  One of the following data types: <ul><li>`int`</li><li>`double`</li><li>`bool`</li><li>`string`</li><li>`datetime`</li><li>`list<T>` -- a list of type `T` (only `string` is supported). See [Lists as input parameters](#lists-as-input-parameters) below. </li></ul>     |
| `<name>`  |  The name of the query.   |
| `<value>`    |  The default value.    |
|  `{<option>: <value>; ...}` |  A list of options and their values.            |
|`<description>` |  The description of the parameter. The description shows up as a tooltip when you hover over the parameter name.  |


Example of a query with one parameter:

```sql
--input: string productName  
select * from products where productname = @productName
```

When you run this query, the following dialog appears:

![Query input dialog](/help/images/access/query-input-dialog.png)

<!-- {pattern: datetime} -->

### Lists as input parameters 

Lists can only be used in SQL operators that take a range of values, such as `ANY` or `ALL`.

TODO: use `list<string>` as the parameter type and enter a comma-separated list of values in the query dialog.


Select customers from a specific list of countries:

```sql
--input: list<string> country =  
select companyname from customers where country = ANY(@country)
```

Select customers from countries other than the given list: 

```sql
--input: list<string> country =  
select companyname from customers where country <> ALL(@country)
```



### Drop-down lists 

An input parameter can be presented as a drop-down list with multiple values. 
The user has to select a value from the list in order to execute the query.
The values in the list can be predefined, or obtained by executing another query.

Example of a list with predefined values:

```sql
--input: string shipCountry = France {choices: ['France', 'Italy', 'Germany']}
```

Example of a list with values returned by another SQL query:

```sql
--input: string shipCountry = France {choices: Query("SELECT DISTINCT shipCountry FROM Orders")}
```

Example of a list with values returned by an existing data query:

```sql
--input: string shipCountry = France {choices: Demo:northwind:countries}
```

Here `Demo:northwind:countries` is a reference to a query named `countries` under connection `northwind` in package `Demo`.  

### Input fields with suggestions 

To define a list of suggested values for an input field, use the `suggestions` option:

```sql
--input: string shipCountry = France {suggestions: Demo:northwind:countries}
```

In this example, the list of suggestions is retrieved by executing an existing data query.  