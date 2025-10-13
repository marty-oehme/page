---
title: "SQL basics learn-along"
subtitle: "Follow me as I explore Select Star SQL"
description: "Follow me as I explore Select Star SQL"
author:
  - Marty Oehme
date: today
pubDate: "2024-01-24T09:10:23+01:00"
weight: 10
toc: true
tags:
  - sql
  - analysis
---

-   [Quick Introduction](#quick-introduction)
-   [Chapter 1 - Individual operations](#sec-individual)
-   [Chapter 2 - Aggregations](#sec-aggregation)
-   [Chapter 3 - Grouping and Nesting](#sec-grouping)
-   [Chapter 4 - Joins and Dates](#sec-joining)
-   [Quick Conclusion](#quick-conclusion)

## Quick Introduction

I have recently been brushing up on my SQL skills,
because I firmly believe they are one of the most fundamental knowledge areas if you do anything to do with data.

The following content will follow along with the excellent [Star Select SQL](https://selectstarsql.com/) introductory resource to SQL.
We will go through all four chapters, and follow most of the examples and challenges given.
Sometimes, however, we will swerve a little and approach things slightly differently,
or with a different query twist -
just because my mind obviously works differently than that of Zi Chong Kao who wrote the book.

In general, there is slightly more of a focus on the actual SQL statements,
the knowledge imparted and perhaps a more explicit wording regarding notes and limits in the queries.

Less of a focus is given to the meaning of the data under analysis,
though we of course still use the same dataset, and attempt to draw the same conclusions from similar queries.
In other words:
If you want to learn (and be excited by the possibilities and challenges of) SQL, go to [Select Star SQL](https://selectstarsql.com/).
If you have already done it and want a refresher, this page will give you a quick overview separated by topical chapter.
Or use it as inspiration to read-along like I did.

This document uses quarto under the hood and we will experiment a little with the R SQL interactions along the way.
It is also my first attempt to really integrate quarto publications into this blog,
in an attempt to ease the process for the future.
For now, we just load the database (as an SQLite file) and show which table we have,
using some R packages:

``` r
suppressPackageStartupMessages(library(tidyverse)) # suppressing conflict warnings in outputs
library(DBI)
library(RSQLite)
con <- dbConnect(SQLite(), "data/tx_deathrow_full.db")
as.data.frame(dbListTables(con))
```

      dbListTables(con)
    1          deathrow

That seems reasonable! We have a single table in the dataset, called `deathrow`.

This is perhaps a good moment to mention that the tables and colums do *not* have the exact same names as they do on the website's interactive follow-along boxes.
Instead, they have the column names that the author gave the columns for the full data set that he made available as a csv download, I have not changed any of them.

<details>
<summary>
A list of all column headers in the `deathrow` table.
</summary>

| ID  | Name                    | Type |
|-----|-------------------------|------|
| 0   | Execution               | TEXT |
| 1   | Date of Birth           | TEXT |
| 2   | Date of Offence         | TEXT |
| 3   | Highest Education Level | TEXT |
| 4   | Last Name               | TEXT |
| 5   | First Name              | TEXT |
| 6   | TDCJ Number             | TEXT |
| 7   | Age at Execution        | TEXT |
| 8   | Date Received           | TEXT |
| 9   | Execution Date          | TEXT |
| 10  | Race                    | TEXT |
| 11  | County                  | TEXT |
| 12  | Eye Color               | TEXT |
| 13  | Weight                  | TEXT |
| 14  | Height                  | TEXT |
| 15  | Native County           | TEXT |
| 16  | Native State            | TEXT |
| 17  | Last Statement          | TEXT |

</details>

Perhaps, for a future version it might be an interesting data cleaning experiment to actually change them to the same names before following the book.

A last caveat before we begin.
In the following chapters you will learn what they are described by and pick up a few extra functions and ideas along the way.
You will not learn anything beyond *querying* data (table creation, modification),
nothing about windowing nor any of the specific more common table expressions.

If you want to learn about those, there is a more reference-focused explanation available at [SQL Tutorial](https://www.sqltutorial.org/) which is a really nice next step when applying the mental maps passed along by the book this post is based on to new challenges and exploratory projects.
I will try to point to some further SQL resources at the end of this post.
Finally and, without further ado, let's get started.

## Chapter 1 - Individual operations

For now, to test the database connection, we simply print three inmate names:
We do so by doing a `SELECT` for just three rows from the overall table.

``` sql
-- SELECT * FROM deathrow LIMIT 3;
SELECT "First Name", "Last Name" FROM deathrow LIMIT 3;
```

| First Name          | Last Name |
|:--------------------|:----------|
| Christopher Anthony | Young     |
| Danny Paul          | Bible     |
| Juan Edward         | Castillo  |

3 records

Everything seems to be working smoothly, and we can even directly create `sql` code chunks which connect to our database.
Neat!

The star indeed selects 'everything' (somewhat like globbing) which means we `SELECT` *everything* from out deathrow table, but limit the number of rows to three.
In other words, `SELECT` is more oriented towards columns, with `LIMIT` (and later e.g. `WHERE`) instead filtering out rows.

The 'star' selection is only a theory in this document, unfortunately,
with `quarto` (and `knitr`) as our rendering engines.
Doing this selection here would just end in a word-spaghetti since we just have *too many columns* to nicely display.
Instead, we limit ourselves to just a couple.
You can see the 'star' selection as a comment underneath the one we did, however.

For now, we `SELECT` from out table.
We do not have to.
Selections at their most basic simply return whatever returns a boolean 'truthy' value for the columns passed in,
even if we do not `SELECT` `FROM` a specific table:

``` sql
SELECT 50 + 2, 51 / 2, 51 / 2.0;
```

| 50 + 2 | 51 / 2 | 51 / 2.0 |
|-------:|-------:|---------:|
|     52 |     25 |     25.5 |

1 records

This example also reflects the float/integer differences in SQL:
If you only work with integers, the result will be an integer.
To work with floating point numbers at least one of the involved numbers has to be a float.
Often this is accomplished by just multiplying with `* 1.0` at some point in the query.

Having filtered on *columns* above with `SELECT`, let us now filter on *rows* with the `WHERE` block:

``` sql
SELECT "Last Name", "First Name"
FROM deathrow
WHERE "Age at Execution" <= 25;
```

| Last Name  | First Name |
|:-----------|:-----------|
| Patterson  | Toronto    |
| Jones      | T.J.       |
| Beazley    | Napoleon   |
| Andrade    | Richard    |
| Pinkerton  | Jay        |
| De La Rosa | Jesse      |

6 records

In this case, we filter for all executions aged 25 and under (only very few due to the lengthy process).
`WHERE` blocks take an expression which results in a boolean truth value (in this case 'is it smaller than or equal to?'),
and for every row that the result is true will include them for the rest of the query.

This bit is also important, as `WHERE` operations will generally run before other operations such as `SELECT` or aggregations, as we will see in the next chapter.

As a last bit to notice, the order of `SELECT` conditions also matters:
it is the order the rows will appear as in the resulting table.
Here, we switched first and last names compared to the last table query.

While numeric comparisons are one thing, we can of course filter on text as well.
A single equals sign generally accomplishes conditional comparison:

``` sql
SELECT "First Name", "Last Name"
FROM deathrow
WHERE "Last Name" = "Jones";
```

| First Name | Last Name |
|:-----------|:----------|
| George     | Jones     |
| T.J.       | Jones     |
| Claude     | Jones     |
| Richard    | Jones     |
| Raymond    | Jones     |

5 records

Of course, string comparison needs some leeway to account for small differences in the thing to be searched for.
For example, names could have additions ('Sr.', 'Jr.') or enumeration ('John II') or even simple misspellings.
We can use `LIKE` to help with that for string comparisons:

``` sql
SELECT "First Name", "Last Name", "Execution"
FROM deathrow
WHERE "First Name" LIKE 'Raymon_'
    AND "Last Name" LIKE '%Landry%';
```

| First Name | Last Name   | Execution |
|:-----------|:------------|:----------|
| Raymond    | Landry, Sr. | 29        |

1 records

It allows a few wildcards in your queries to accomplish this:
`_` matches exactly one character,
while `%` matches any amount of characters.
Both only operate in the place the are put, so that `%Landry` and `%Landy%` can be different comparisons.

Above you can also see that we can logically concatenate query parts.
The precedence order goes `NOT`, then `AND`, then `OR`, so that the following:

``` sql
SELECT 0 AND 0 OR 1;
```

| 0 AND 0 OR 1 |
|-------------:|
|            1 |

1 records

Returns `1`.
It reads '0 and 0', which results in a 0; and *then* it reads '0 or 1' which ultimately results in a 1.
To re-organize them into the precedence we require, simply use parentheses:

``` sql
SELECT 0 AND (0 OR 1);
```

| 0 AND (0 OR 1) |
|---------------:|
|              0 |

1 records

The parenthesized `OR` clause is now looked at before the `AND` clause, resulting in a 0.

As a cap-stone for Chapter 1,
and to show that we do *not* need the column we filter on (with `WHERE`) as a `SELECT`ed one in the final table,
we will select a specific statement:

``` sql
SELECT "Last Statement"
FROM deathrow
WHERE "Last Name" = 'Beazley';
```

| Last Statement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|:-----------------------------------------------------------------------|
| The act I committed to put me here was not just heinous, it was senseless. But the person that committed that act is no longer here - I am. I'm not going to struggle physically against any restraints. I'm not going to shout, use profanity or make idle threats. Understand though that I'm not only upset, but I'm saddened by what is happening here tonight. I'm not only saddened, but disappointed that a system that is supposed to protect and uphold what is just and right can be so much like me when I made the same shameful mistake. If someone tried to dispose of everyone here for participating in this killing, I'd scream a resounding, "No." I'd tell them to give them all the gift that they would not give me...and that's to give them all a second chance. I'm sorry that I am here. I'm sorry that you're all here. I'm sorry that John Luttig died. And I'm sorry that it was something in me that caused all of this to happen to begin with. Tonight we tell the world that there are no second chances in the eyes of justice...Tonight, we tell our children that in some instances, in some cases, killing is right. This conflict hurts us all, there are no SIDES. The people who support this proceeding think this is justice. The people that think that I should live think that is justice. As difficult as it may seem, this is a clash of ideals, with both parties committed to what they feel is right. But who's wrong if in the end we're all victims? In my heart, I have to believe that there is a peaceful compromise to our ideals. I don't mind if there are none for me, as long as there are for those who are yet to come. There are a lot of men like me on death row - good men - who fell to the same misguided emotions, but may not have recovered as I have. Give those men a chance to do what's right. Give them a chance to undo their wrongs. A lot of them want to fix the mess they started, but don't know how. The problem is not in that people aren't willing to help them find out, but in the system telling them it won't matter anyway. No one wins tonight. No one gets closure. No one walks away victorious. |

1 records

## Chapter 2 - Aggregations

We can use aggregators (such as `COUNT`, `MEAN` or `MEDIAN`) to consolidate information from *multiple* rows of input.

``` sql
SELECT COUNT("Last Statement") FROM deathrow WHERE "Last Statement" != '';
```

| COUNT("Last Statement") |
|------------------------:|
|                     443 |

1 records

Here, we diverge slightly from the book:
Whereas for them, NULLs are used where no statement exists, this is not so for our dataset.

Since we did no cleaning after importing from csv, empty statements will be imported as an empty string and not a `NULL` object.
Since count uses `NULL` objects (as a 'non-count' if you want) we additionally have to select all those rows where the statements are not empty strings.

We can count the overall number of entries (i.e. the denominator for later seeing which share of inmates proclaimed innocence) by `COUNT`ing a column which we know to have a value for each entry:

``` sql
SELECT COUNT("ex_age") FROM deathrow;
```

| COUNT("ex_age") |
|----------------:|
|             553 |

1 records

Or, even better as the book shows, use `COUNT(*)` to count the value in all columns. Since we can't have completely `NULL` rows (the row would just not exist), we will definitely get an overall count back this way:

``` sql
SELECT COUNT(*) FROM deathrow;
```

| COUNT(\*) |
|----------:|
|       553 |

1 records

Now, let's see how we can combine this with conditional `CASE WHEN` statements.

Let's find all inmates from 'Harris' or 'Bexar' country:

``` sql
SELECT
    SUM(CASE WHEN "County"='Harris' THEN 1 ELSE 0 END),
    SUM(CASE WHEN "County"='Bexar' THEN 1 ELSE 0 END)
FROM deathrow;
```

| SUM(CASE WHEN "County"='Harris' THEN 1 ELSE 0 END) | SUM(CASE WHEN "County"='Bexar' THEN 1 ELSE 0 END) |
|-----------------------------------:|-----------------------------------:|
|                                                128 |                                                46 |

1 records

We can try to find the number of inmates that where over 50 years old at their point of execution:

``` sql
SELECT COUNT(*) FROM deathrow WHERE "Age at Execution" > 50;
```

| COUNT(\*) |
|----------:|
|        68 |

1 records

You can see that the `WHERE` block selects *before* we run aggregations.
That is useful since we first reduce the amount of entries we have to consider before further operations.

Now, we can practice working with conditions, counts and cases for the same goal:
Finding all instances where inmates did *not* give a last statement.

First, we will do so again with a `WHERE` block:

``` sql
SELECT COUNT(*) FROM deathrow WHERE "Last Statement" = '';
```

| COUNT(\*) |
|----------:|
|       110 |

1 records

Then, we can do the same, but using a `COUNT` and `CASE WHEN` blocks:

``` sql
SELECT
    COUNT(CASE WHEN "Last Statement" = '' THEN 1 ELSE NULL END)
FROM deathrow;
```

| COUNT(CASE WHEN "Last Statement" = '' THEN 1 ELSE NULL END) |
|------------------------------------------------------------:|
|                                                         110 |

1 records

This is a little worse performance-wise.
Whereas in the first attempt (using `WHERE`) we first filter the overall table down to relevant entries and then count them, here we go through the whole table to count each (or 'not-count' those we designate with `NULL`).

Lastly, if we had cleaned the data correctly before using it here (especially designated empty strings as `NULL` objects), we could use `COUNT` blocks only:

``` sql
SELECT
    COUNT(*) - COUNT("Last Statement")
FROM deathrow;
```

| COUNT(\*) - COUNT("Last Statement") |
|------------------------------------:|
|                                   0 |

1 records

You can see, however, that this results in `0` entries -- we count *all* entries both times since nothing is `NULL`.
While somewhat contrived here, it should point to the fact that it is generally better to have clean `NULL`-designated data before working with it.

However, this way of counting would also be the least performant of the three, with all rows being aggregated with counts twice.

In other words, the exercise showed us three things:

-   there are many ways to skin an SQL query
-   correct `NULL` designations can be important during cleaning
-   performant operations should generally filter before aggregating

There are more aggregation functions, such as `MIN`, `MAX`, `AVG`.[^1]

``` sql
SELECT
    MIN("Age at Execution"),
    MAX("Age at Execution"),
    AVG("Age at Execution")
FROM deathrow;
```

| MIN("Age at Execution") | MAX("Age at Execution") | AVG("Age at Execution") |
|:-----------------------|:-----------------------|-----------------------:|
| 24                      | 67                      |                39.47016 |

1 records

We can also combine aggregations, running one on the results of another (just like combining function outputs in e.g. python).
Here is an example calculating the average length of statements, for cases where a statement exists using the `LENGTH` aggregation:

``` sql
SELECT
    AVG(LENGTH("Last Statement"))
FROM deathrow
WHERE "Last Statement" != '';
```

| AVG(LENGTH("Last Statement")) |
|------------------------------:|
|                      537.4921 |

1 records

Another aggregation is `DISTINCT` which works somewhat like the program `uniq` on Unix systems:

``` sql
SELECT DISTINCT("County") FROM deathrow;
```

| County  |
|:--------|
| Bexar   |
| Harris  |
| Tarrant |
| Lubbock |
| Dallas  |
| Hidalgo |
| Bee     |
| Houston |
| Hunt    |
| Collin  |

Displaying records 1 - 10

It presents all the options (or 'categories' if you think of your data as categorical) that are represented in a column, or the output of another aggregation.

On its face it is less of an *aggregation* function as the book remarks, since it does not output "a single number".
But since it 'aggregates' the contents of multiple rows into its output I would still very much classify it as such.

Finally, let's look at what happens with 'misshapen' queries:

<!-- ::: {#lst-strange-query} -->

``` sql
SELECT "First Name", COUNT(*) FROM deathrow;
```

| First Name          | COUNT(\*) |
|:--------------------|----------:|
| Christopher Anthony |       553 |

1 records

<!-- A strange query -->
<!-- ::: -->

Here, we make a query which is indeed very strange:
The `COUNT` aggregation wants to output a single aggregated number, while the single column selection `"First Name"` wants to output each individual row.

What happens?
The database goes easy on us and does not error out but uses the aggregation as guide that we only receive a single output back and picks an entry from the first names.

In the book, this is the last entry ('Charlie'), though it does warn that not all databases return the same.
This is reflected in the SQLite query here in fact returning the *first* entry ('Christopher Anthony') instead.

The lesson being to *not* rely on unclear operations like this but being explicit if, say, we want to indeed grab the last entry of something:

``` sql
SELECT "First Name" FROM deathrow ORDER BY ROWID DESC LIMIT 1;
```

| First Name |
|:-----------|
| Charlie    |

1 records

Since SQLite does not come with a convenient `LAST` aggregator (some other databases do),
we need to work around it by reversing the order of the table based on its `ROWID` (which increase for each entry).
Thus, the highest `ROWID` is the last entry.
Having reversed it, we can limit the output to the very last one to arrive back at 'Charlie'.[^2]

However, this operation (as far as I know for now) is now not compatible anymore with *also* aggregating on a row count like we did above.

So, for the final query in this aggregation chapter, let's see the share of inmates which insisted on their innocence even during the last statement:

``` sql
SELECT
    1.0 * COUNT(CASE WHEN "Last Statement" LIKE '%innocent%' THEN 1 ELSE NULL END) / (COUNT(*)) * 100
FROM deathrow;
```

| 1.0 \* COUNT(CASE WHEN "Last Statement" LIKE '%innocent%' THEN 1 ELSE NULL END) / (COUNT(*)) * 100 |
|-----------------------------------------------------------------------:|
|                                                                                           5.605787 |

1 records

We can see that over 5% of the people proclaimed their innocence even during their final statement.

Of course, this method of simple string matching has some issues:
If somebody uses other statements (the book mentions the example of 'not guilty') we have a lower bound of proclamations.
We also do not know in what way people used the word -- what if they instead proclaimed *not* being innocent?
We would rather have a higher bound than the true number in this case.

At the same time, we do not know the thoughts of the people not giving last statements at all.
Perhaps, it would also make sense to compare only the number of people who did give a statement (but did not mention their innocence) with those who did, which would put us on the lower bound again.

We can see this behavior if we just show a sub-section of the statements:

``` sql
SELECT "First Name", "Last Statement"
FROM deathrow
WHERE "Last Statement" LIKE '%innocent%'
LIMIT 4;
```

| First Name | Last Statement                                                                                                                                                                                                                                                                                                                                                             |
|:---|:-------------------------------------------------------------------|
| Jeffrey    | You clown police. You gonna stop with all that killing all these kids. You're gonna stop killing innocent kids, murdering young kids. When I kill one or pop one, ya'll want to kill me. God has a plan for everything. You hear? I love everyone that loves me. I ain't got no love for anyone that don't love me.                                                        |
| Preston    | Yes, Warden. Mom, Celeste: Please know I'm innocent and I love you both. Please continue to fight for my innocence even though I'm gone. John, Cort, Allen, Barbara, Louis, and Anna: Thank you for helping me and trying to save my life. I love you. Give everybody my love. Jason, thank you for your friendship. Thank Laura, too. I love all of you. Bye. Ok, Warden. |
| Jonathan   | I'm an innocent man. I did not kill anyone. Ya'll are killing an innocent man. My left arm is killing me. It hurts bad.                                                                                                                                                                                                                                                    |
| Keith      | All I want to say is I'm innocent, I didn't kill my wife. Jack Leary shot my wife then her dope dealer Guy Fernandez. Don't hold it against me, Bill. I swear to God I didn't kill her. Go ahead and finish it off. You can taste it.                                                                                                                                      |

4 records

While Preston, Jonathan and Keith do protest their innocence to the warden, their loved ones or the world,
Jeffrey instead mentions 'innocent kids'.
Now, he could include himself in this category but we do not know for sure.

So, this concludes a chapter about *aggregating*:
operating with functions on multiple rows in the dataset, allowing study of more system-level behavior in the data.

## Chapter 3 - Grouping and Nesting

After dealing with individual rows (Ch 1) and aggregations (Ch 2), we will now do some data *organization* based on specific rows or columns -
a sort of mish-mash between keeping multiple rows in the output like in the first case and doing operations on them like in the latter.

The chapter begins by looking at a visualization of the data, which shows a strong long right tail (or, right skew as I know it called).
We ultimately will end the chapter by taking a look at the percentage breakdown of executions each county contributed to investigate this skew.

Grouping can be accomplished with the `GROUP BY` block:[^3]

``` sql
SELECT
    "County",
    COUNT(*) AS county_executions
FROM deathrow
GROUP BY "County"
;
```

| County   | county_executions |
|:---------|------------------:|
| Anderson |                 4 |
| Aransas  |                 1 |
| Atascosa |                 1 |
| Bailey   |                 1 |
| Bastrop  |                 1 |
| Bee      |                 2 |
| Bell     |                 3 |
| Bexar    |                46 |
| Bowie    |                 5 |
| Brazoria |                 4 |

Displaying records 1 - 10

This reminds a lot of the 'misshapen' query above, however, there is a key difference:
Even when doing aggregations around it, the column(s) *being grouped on* is allowed to be a multi-output column (called 'grouping columns').

Let's first do another quick grouping query to see how it can work.
We'll try to find the most common last names:

``` sql
SELECT "Last Name", COUNT(*) AS count
FROM deathrow
GROUP BY "Last Name"
ORDER BY "count" DESC
;
```

| Last Name | count |
|:----------|------:|
| Johnson   |     9 |
| Hernandez |     7 |
| Williams  |     6 |
| Martinez  |     6 |
| Green     |     6 |
| Jones     |     5 |
| Harris    |     5 |
| White     |     4 |
| Smith     |     4 |
| Moore     |     4 |

Displaying records 1 - 10

The code above also makes use of *aliasing*, with an `AS <new-name>` block with which you can provide an efficient short-hand or new name for `SELECT` outputs.
I believe it also works for the outputs of e.g. `JOIN` operations.

Let's now have a breakdown of executions with and without a last statement by county:

``` sql
SELECT 
    "Last Statement" IS NOT '' AS has_last_statement,
    "County",
    COUNT(*)
FROM deathrow
GROUP BY "County", "has_last_statement"
;
```

| has_last_statement | County   | COUNT(\*) |
|-------------------:|:---------|----------:|
|                  1 | Anderson |         4 |
|                  1 | Aransas  |         1 |
|                  1 | Atascosa |         1 |
|                  1 | Bailey   |         1 |
|                  1 | Bastrop  |         1 |
|                  1 | Bee      |         2 |
|                  0 | Bell     |         1 |
|                  1 | Bell     |         2 |
|                  0 | Bexar    |         9 |
|                  1 | Bexar    |        37 |

Displaying records 1 - 10

The order in which you group by here matters!
In this case, we first order by county and then statements -
all 'Anderson' inmates appear first, then all 'Aransas', at some point the 'Bell' county cases, both those with and without statement, before 'Bexar' county, and so on.
Had we the groupings the other way around,
we would first have all `has_last_statement = 0` entries, from 'Anderson' county to 'Wood' county last, and then repeat the same for all counts of cases with statements.

Also, we can of course manually influence this order.
Using the `ORDER BY` block we can choose a column with which to order, so regardless of the grouping sequence we can make sure to for example order on counties.
We can of course also sort by different column altogether of course, such as the counts which would then require a naming alias.
Using `ORDER BY "Column" DESC` we can reverse the sorting.
Here is the same example from above implementing most of these ideas:

``` sql
SELECT 
    "Last Statement" IS NOT '' AS has_last_statement,
    "County",
    COUNT(*) AS number
FROM deathrow
GROUP BY "has_last_statement", "County"
ORDER BY "number" DESC
;
```

| has_last_statement | County     | number |
|-------------------:|:-----------|-------:|
|                  1 | Harris     |     95 |
|                  1 | Dallas     |     52 |
|                  1 | Bexar      |     37 |
|                  1 | Tarrant    |     35 |
|                  0 | Harris     |     33 |
|                  1 | Lubbock    |     12 |
|                  1 | Montgomery |     12 |
|                  1 | Smith      |     12 |
|                  1 | Jefferson  |     11 |
|                  1 | Nueces     |     11 |

Displaying records 1 - 10

We already know from [Section 3](#sec-aggregation) that `WHERE` blocks will take place before any aggregation.
The same is true for groupings - `WHERE` will always execute (and thus filter) before `GROUP BY` executes.

The following counts the number of inmates executed that were at least 50 for each county:

``` sql
SELECT 
    "County",
    COUNT(*) AS number
FROM deathrow
WHERE "Age at Execution" >= 50
GROUP BY "County"
;
```

| County    | number |
|:----------|-------:|
| Anderson  |      1 |
| Bexar     |      2 |
| Caldwell  |      1 |
| Cameron   |      1 |
| Collin    |      2 |
| Comal     |      1 |
| Dallas    |     11 |
| Galveston |      2 |
| Grayson   |      1 |
| Gregg     |      2 |

Displaying records 1 - 10

We do not select the age column for further consideration, but since `WHERE` runs before all other operations we also do not need it.
But what if we want to filter on the *outputs* of grouping or aggregation functions?
The `HAVING` block solves that.

The following shows the counties in which at least two inmates 50 or older were executed:

``` sql
SELECT 
    "County",
    COUNT(*) AS number
FROM deathrow
WHERE "Age at Execution" >= 50
GROUP BY "County"
HAVING "number" > 2
ORDER BY "number" DESC
;
```

| County     | number |
|:-----------|-------:|
| Harris     |     21 |
| Dallas     |     11 |
| Montgomery |      5 |
| Tarrant    |      4 |
| Lubbock    |      3 |

5 records

As one interesting fact for possibly more advanced queries:
`GROUP BY` blocks do *not* need the columns on which they group to be in the `SELECT` block!
Generally this does not make a lot of sense - when we group by county but do not see county then it just seems like fairly weird groupings,
but there will invariably be situations where this knowledge is useful.

``` sql
SELECT "County"
FROM deathrow
GROUP BY "County"
;
```

| County   |
|:---------|
| Anderson |
| Aransas  |
| Atascosa |
| Bailey   |
| Bastrop  |
| Bee      |
| Bell     |
| Bexar    |
| Bowie    |
| Brazoria |

Displaying records 1 - 10

This exactly mirrors the `SELECT DISTINCT` aggregation, but is accomplished with grouping instead.
Many ways to skin a query again!

Now let's pivot a little and look at query nesting.
Since we sometimes will want to run one query leading into another (e.g. to compute percentages),
we have to have some way to integrate them with another.
We do so through *nested queries*, demarcated with `(parantheses)` within another query.

Let's see how we utilize this to select the inmate with the longest last statement:

``` sql
SELECT "First Name", "Last Name"
FROM deathrow
WHERE LENGTH("Last Statement") = 
    (  
        SELECT MAX(LENGTH("Last Statement"))
        FROM deathrow
    )
;
```

| First Name | Last Name |
|:-----------|:----------|
| Gary       | Graham    |

1 records

It looks a little cumbersome but essentially we first filter on the row whose statement length is (exactly) the length of the longest statement,
previously queried as a separate sub-query.

Why do need a nested query here?
The book itself explains it most succinctly:

> nesting is necessary here because in the WHERE clause,
> as the computer is inspecting a row to decide if its last statement is the right length,
> it can't look outside to figure out the maximum length across the entire dataset.
> We have to find the maximum length separately and feed it into the clause.

We will now attempt to do the same to find the percentage of all executions contributed by each county:

``` sql
SELECT
    "County",
    100.0 * COUNT(*) / (
        SELECT COUNT(*)
        FROM deathrow
    ) as percentage
FROM deathrow
GROUP BY "County"
ORDER BY "percentage" DESC
;
```

| County     | percentage |
|:-----------|-----------:|
| Harris     |  23.146474 |
| Dallas     |  10.488246 |
| Bexar      |   8.318264 |
| Tarrant    |   7.414105 |
| Nueces     |   2.893309 |
| Montgomery |   2.712477 |
| Jefferson  |   2.712477 |
| Lubbock    |   2.350814 |
| Smith      |   2.169982 |
| Brazos     |   2.169982 |

Displaying records 1 - 10

It follows the same concept:
We need to invoke a nested query because our original query is already fixated on a sub-group of all rows and we **can not get out of it within our query**.
Instead, we invoke another query 'before' the original which still has access to all rows and create our own nested aggregation.
The output of that then feeds into the original query.

Quite clever, a little cumbersome, and presumably the origin of quite a few headaches in writing elegant SQL queries.

## Chapter 4 - Joins and Dates

Before we look at joins, let's look at handling dates (as in, the data type) in SQL.
While we have a couple of columns of reasonably formatted dates (ISO-8601), that doesn't mean we can automatically use them as such.
To make use of such nice and clean data we should use operations that specifically [make use of dates](https://www.sqlite.org/lang_datefunc.html) for their calculations.

``` sql
SELECT 
    julianday('1993-08-10') - julianday('1989-07-07') as day_diff
;
```

| day_diff |
|---------:|
|     1495 |

1 records

The `julianday()` function will transform our ISO-compatible dates into timestamp floats on which we can operate like usual, in this case subtracting the latter from the former to get the period of time between them.
Like the unix timestamp, the Julian day counts from a specific point in time as 0 continuously upwards,
only that it counts from 4714 B.C.E. (not 1971) and per-day not per-second.
Anything below a single day is fractional.
Half a day's difference would thus be `0.5` difference, making it perhaps more useful to work with larger time differences.

Now we will join a table with itself, only shifted by a row.
This will make it necessary to prepare the date for the 'other' table first,
adding one to the column we are going to join on.

``` sql
SELECT 
    "Execution" + 1 AS ex_number,
    "Execution Date" AS prev_ex_date
FROM deathrow
WHERE "Execution" < 553
```

| ex_number | prev_ex_date |
|----------:|:-------------|
|       553 | 2018-06-27   |
|       552 | 2018-05-16   |
|       551 | 2018-04-25   |
|       550 | 2018-03-27   |
|       549 | 2018-02-01   |
|       548 | 2018-01-30   |
|       547 | 2018-01-18   |
|       546 | 2017-11-08   |
|       545 | 2017-10-12   |
|       544 | 2017-07-27   |

Displaying records 1 - 10

We could perhaps use `julianday` comparisons, but since we have access to the execution numbers and they are rolling we can instead use them like an ID and just shift it one up.

Now we want to put data from one row into *another* row and neither aggregations nor groups can help us out.
Instead, to gain access to data from other rows (whether in the same or another table) we use the `JOIN` block.
There is an `INNER JOIN` (the default), a `LEFT JOIN`, a `RIGHT JOIN` and an `OUTER JOIN` block.

**The different joins only differ in how they handle unmatched rows.**
With an inner join, any unmatched rows are dropped completely (essentially intersection merge),
with an outer join unmatched rows are preserved completely from both tables (union merge),
with a left join unmatched rows from the *left* (i.e. `FROM XY`) table are preserved,
with a right join unmatched rows from the *right* (`JOIN XY`) table.

This prepares our table to be used to join 'itself', adding those rows (shifted) together which we want.
Of course, we do not have to shift in our selection already, and I find it more intuitive to do so in the value comparison.
We end up with the following query:

``` sql
SELECT 
    "Execution Date",
    prev_ex_date AS "Previous Execution",
    JULIANDAY("Execution Date") - JULIANDAY(prev_ex_date) AS "Difference in Days"
FROM deathrow
JOIN (
    SELECT 
        "Execution" AS ex_number,
        "Execution Date" AS prev_ex_date
    FROM deathrow
    WHERE "Execution" < 553
) AS previous
ON deathrow."Execution" = previous.ex_number + 1
ORDER BY "Difference in Days" DESC
LIMIT 10
;
```

| Execution Date | Previous Execution | Difference in Days |
|:---------------|:-------------------|-------------------:|
| 1984-03-14     | 1982-12-07         |                463 |
| 1988-11-03     | 1988-01-07         |                301 |
| 2008-06-11     | 2007-09-25         |                260 |
| 1991-02-26     | 1990-07-18         |                223 |
| 1984-10-30     | 1984-03-31         |                213 |
| 1996-09-18     | 1996-02-27         |                204 |
| 2016-10-05     | 2016-04-06         |                182 |
| 1986-03-12     | 1985-09-11         |                182 |
| 2014-09-10     | 2014-04-16         |                147 |
| 1997-02-10     | 1996-09-18         |                145 |

Displaying records 1 - 10

This shows us the top ten timeframes in which no executions occured.
You can see we do the shifting in the `ON` block itself, leading to the more natural reading of
'join the tables on execution number being the same as the previous execution number plus one'.
For my brain this is more easily comprehensible as a row-shift.
Otherwise, we only select the execution number
(though we only need it for the shift operation and drop it in the outer selection)
and the execution date which is the one important column we are looking for.

We also do not include Execution number 553 (the largest execution number) since there will be no newer execution to join it with in the dataset.
The resulting table will not be different if we do not, however.
Remember we are doing an `INNER JOIN`, which drops any non-matching rows by default.

Such a 'self join' is a common technique to **grab information from other rows** from the same table.
This is already quite an advanced query!

The book plots a graph here, which I will not replicate for the moment.
However, it shows that roughly to pre-1993 there was a lower overall execution count,
with two clearly visible larger hiatuses afterwards.

Let's focus on those two hiatuses and limit the data to not show pre-1993 executions.
As a last thing, let's make it a little more elegant by making the original ('previous') table query way simpler:

``` sql
SELECT 
    previous."Execution Date" AS "Beginning of period",
    deathrow."Execution Date" AS "End of period",
    JULIANDAY(deathrow."Execution Date") - JULIANDAY(previous."Execution Date") AS "Difference in Days"
FROM deathrow
JOIN deathrow AS previous
ON deathrow."Execution" = previous."Execution" + 1
WHERE DATE(deathrow."Execution Date") > DATE('1994-01-01')
ORDER BY "Difference in Days" DESC
LIMIT 10
;
```

| Beginning of period | End of period | Difference in Days |
|:--------------------|:--------------|-------------------:|
| 2007-09-25          | 2008-06-11    |                260 |
| 1996-02-27          | 1996-09-18    |                204 |
| 2016-04-06          | 2016-10-05    |                182 |
| 2014-04-16          | 2014-09-10    |                147 |
| 1996-09-18          | 1997-02-10    |                145 |
| 2017-03-14          | 2017-07-27    |                135 |
| 2010-10-21          | 2011-02-15    |                117 |
| 2009-06-02          | 2009-09-16    |                106 |
| 2016-10-05          | 2017-01-11    |                 98 |
| 2012-11-15          | 2013-02-21    |                 98 |

Displaying records 1 - 10

We can also see much more clearly what the book is talking about with big stays of execution occuring in 1996-1997, as well as 2007-2008.

A little more wordy per line but overall a lot more elegant.
And mostly enabled due to putting the row 'shift' into the `ON` block itself.
However, the importance of good name-aliasing and `JOIN ON` blocks are definitely highlighted.
We are now equipped to grab data from multiple rows, multiple tables and rearrange them as we see necessary.

## Quick Conclusion

So, this should already give a rough mental model for the *kinds* of operations to be done with SQL.

We can operate on the contents of a single row,
we can aggregate the contents of many rows resulting in a single-row output,
we can group by columns which allows us to aggregate into multiple rows,
and we can work with the contents of *other* rows by joining tables.

We have learned to *query* data but not to create or manipulate date,
i.e. working with side-effects.
We also have not learned about the concepts of `window` functions or common table expressions.

These are additional operations to get to know,
but of course it is also important to get an overall broader view onto the concepts and mental mapping of SQL itself.
The book closes with a call-to-challenge, with an additional dataset to knock your teeth on.

If you are looking for more material to learn SQL or challenge yourself with:[^4]

-   [SQL Tutorial](https://www.sqltutorial.org/):
    I mentioned this one at the very beginning.
    It provides a next stepping stone and reference material for most of the blocks and expressions used in SQL.
    It is less prosaic and project-bound than this book, but a good bookmark to keep at all times.
-   In a similar vein but completely geared towards SQLite, the [SQLite Tutorial](https://www.sqlitetutorial.net/).
-   Another fun resource, from basics to advanced with challenges along the way is provided on [SQLZoo](https://sqlzoo.net/wiki/SQL_Tutorial).
    It may be a fun way to test some of the knowledge you already have now.
-   A short conceptual blog entry on [Common Table Expressions](https://www.dataknowsall.com/cte.html) which should give you the gist.
    From here, perhaps you can start to think about how to incorporate them into the other projects.
-   Interactive practice sessions at [SQL Practice](https://www.sql-practice.com/).
    You can follow along increasingly difficult sample exercises, or jump straight into whatever level or concept you feel the need to practice.
-   The Stanford-supplied long-form courses for [Beginner](https://online.stanford.edu/courses/soe-ydatabases0005-databases-relational-databases-and-sql) and [Advanced](https://online.stanford.edu/courses/soe-ydatabases0001-databases-advanced-topics-sql) SQL.
    Obviously more of an investment than most of the previous ones.
-   And finally, more of a heavy hitter: A [book](https://bookwyrm.social/book/1517140/s/t-sql-querying-developer-reference) by Ben-Gan, teaching SQL by way of set theory to really grasp the underlying concepts.

[^1]: The book recommends documentation as [SQLITE](http://sqlite.org), [W3 Schools](https://www.w3schools.com/sql/default.asp) and, of course, Stack overflow.

[^2]: This is cribbed from the very nice tips on grabbing the last SQLite entry on [this Stack Overflow](https://stackoverflow.com/q/24494182) question.

[^3]: You can see that I have started putting the final semicolon on its own separate line.
    It is a technique I have seen being used by 'Alex the Analyst' on YouTube and which I am quite keen on replicating.
    For me, it serves two purposes:
    First, for some SQL dialects, the closing semicolon is actually required and this makes it harder to forget it.
    Second, it provides a visually striking *close* of the query for myself as well, which may be useful once getting into more dense queries.

[^4]: Mind you, I have *not* personally gone through all of the materials here,
    they are the ones that I have either personally found really useful or someone
    specifically recommended them to me.
