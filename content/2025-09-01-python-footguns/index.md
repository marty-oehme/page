---
title: Stumbling blocks when learning python
description: or; How to spot footguns before you trip and shoot yourself
pubDate: 2025-09-01T20:41:51
tags:
  - python
weight: 10
---

What trips you up in Python?

Recently, there has been a thread on the Python subreddit which collected many people's first real
sruggle with python, and there have been a number of surprising answers.[^pythonthread]

[^pythonthread]: The thread can be found here: <https://reddit.com/Python/comments/1n324wb/python_feels_easy_until_it_doesnt_what_was_your/>.

In the following article I have collected some of the most surprising or egregious examples, or
those that everyone will probably face at some point when learning python, or on a bad debugging day.

<!--toc:start-->
- [Relative imports](#relative-imports)
- [Circular imports](#circular-imports)
- [Rounding strategies](#rounding-strategies)
- [Mutability and object referencing](#mutability-and-object-referencing)
- [Functions keep reference to default argument values](#functions-keep-reference-to-default-argument-values)
- [Integer memory caching](#integer-memory-caching)
- [Packaging and environment management](#packaging-and-environment-management)
- [Not knowing how libraries implement features](#not-knowing-how-libraries-implement-features)
- [Metaclasses](#metaclasses)
<!--toc:end-->

Use them to have a little list in your notes somewhere, for those special days where you find
yourself endlessly debugging without any apparent cause in your code itself, and perhaps you will
save a couple hours of frustration just because the language thinks different than you do.

## Relative imports

An import in the form `from .mymodule import data_func` is relative, meaning relative to the
current directory. The issue is that the starting location for lookups changes depending on the
location of the root dir. Additionally, some dirs get added into the python path and some others
do not. So ultimately it is always a toss-up if things will run (directly, or through virt env
manager, or via test infra, ...)

Imports in general trip up a lot of new python users -- I know because it also tripped me up at
multiple points of going from single files to multiple files to packages to modules in my early
python journey.

Here's a stackoverflow explanation on the different types of python importing:
<https://stackoverflow.com/questions/14132789/relative-imports-for-the-billionth-time>

If you wish to more deeply understand python imports, here is a (_long_) talk going into the
details:
<https://www.youtube.com/watch?v=0oTh1CXRaQ0>

But as a very general recommendation: just try to avoid relative imports where possible and
instead use module-level imports. The one real advantage they have is their terseness,
where you can do `from .deepmodule import somefunc` instead of `from
mod1.mod2.mod3.mod4.mod5.and_another_module.deepmodule import somefunc`. But I would argue that does not necessarily
offset the negatives associated with relative imports, and when you have modules that deep it
might be time to refactor instead anyway.

## Circular imports

Circular imports occur when you have two modules in python which attempt to import each other.

So, in one file named `start_the_chain` you might have an `import my_nice_utilities` at the top,
in which there might in turn be an `import start_the_chain`. It does not many over how many hops
this circle goes, when the imports are not fully processed and we try to import any of the files
that started an import process on their own earlier we receive this error.

And it makes sense, as if we were to process a file (`start_the_chain` in this case) twice, it
would ultimately lead to an endless chain of imports which just turns in a -- you guessed it --
circle.

The issue can mostly be avoided through constructing consistent 'directional' dependencies. E.g.
in domain-driven designs: Infrastructure (imports) -> services (import) -> Domain structures
(import) -> Models. Here, a model should never have knowledge of the domain structure (e.g.
Repository), those of services, and those of infra. This way, knowledge flows _towards_
implementations (models know barely anything, implementations require more explicit facts).

But that is quite an advanced example. For the beginning just remember, never import a file from
another file which it already imports.

This _can_ still trip you up even if you generally follow uni-directional importing strategies, if
you are also consistently static typing (or with different architecture patterns). In this case
type checking guards can help here.

The following only imports the module if in _type checking_ mode, not during runtime, and thus
avoids the runtime circular imports error:

```python
if TYPE_CHECKING:
  import some_module

def fun(arg: "some_module.SomeType") -> None:
  var: some_module.SomeType = some_implementation()
```

But of course this is also more of a band-aid and has its own idiosyncrasies (e.g. having to quote
the first use of the var per context).

Read more here:
<https://vickiboykis.com/2023/12/11/why-if-type_checking/>

## Rounding strategies

Rounding seems simple enough a problem to fix, and you would not expect a lot of surprises with a
function decisively named `round()`.

```python
round(2.8) # 3
round(2.2) # 2

round(2.5) # 2!
```

Wait, what? -- you will ask yourself, before coming to the conclusion that python must be having a
little laugh with function naming and `round()` acts like it does not understand `.5` is rounded
up.

```python
round(1.8) # 2
round(1.2) # 1

round(1.5) # 2!
```

Excuse me? -- you will shout before throwing up your hands in disgust. This time, python
'correctly' rounds upwards for half values. It just seems to love the number 2.

This is in fact what is happening, kind of. The `round()` function follows a 'half-to-even'
strategy of rounding which, when in doubt (i.e. `.5` values), always rounds toward the nearest
_even_ number. This makes rounding bias less of an issue for really large datasets, but makes
people early on in their learning journey pull their hair out.

If `round()` does not behave like it intuitively should, there must be a replacment? `floor()`
will _always_ round down, `ceil()` wil _always_ round up, and `truncate()` simply cuts off
everything after some digit. But there does not seem to be a way to simply round up at half
values?

A super simple strategy is somethin akin to:

```python
from math import floor

floor(number + 0.5)
```

This will simply add a half-value and then always round down. Simple in a pinch, and should be
quite understandable when you think about it. But look into more advanced versions for robust
rounding -- just remember you probably won't get what you expect with `round()`.

For a far more detailed explanation on rounding in python you can read this article:
<https://www.geeksforgeeks.org/python/how-to-round-numbers-in-python/>

## Mutability and object referencing

This one comes as little surprise to old hats of programming, but _definitely_ trips up those
learning programming with python. In python when we assign a variable, we technically don't
actually assign a variable, but bind an object to a reference. So if we pass 13, we're _kind of_
passing a pointer to a specific 13 number object in memory.

This distinction does not affect us much if we pass immutable values like the `int` 13 above, but
it really starts to affect us with mutable values like a list.

Think about it this way. When we set a variable `x = 7`, what we have is a number object `x` with
the _value_ 7, and with a specific id, e.g. 123, that maps to the actual location in memory
(and can be found out with `id(x)`).[^idsize]

If we now set a second variable `y = x`, what we have done is created a _second_ reference to the
same number object which has the same id. What we have _not_ done is create a new number object.
In other words, if we look at the `id(y)`, we would also get back 123. We have two references
which both point to the same value id.

If we now have the following function:

```python
def foo(y):
  y = y + 1
  return y
```

What happens is that, as the context is created, we at first have another reference to the same
id (123) again, but as we `+ 1` the value of y, we actually create a new number object in the
background, with a new id as well.

In fewer words:

```python
x = 7 # id(x) == 123
y = x # id(y) == id(x) == 123

def foo(y): # id(y) == id(x) == 123
  y = y + 1 # id(y) != id(x), instead some new id, e.g. 125
  return y # id(y) that is returned would also be 125

z = y # id(z) == id(y) == 125
```

All of this may be interesting to know, may not immediately strike you as useful in actual
application. Where it becomes _really_ important, however, it in transferring this knowledge to
mutable python objects like lists.

If we do the following:

```python
l = [1]
k = l
k.append(1)
print(l) # l == [1,1]
```

Since with `k = l` we just assign a new reference to `l` with the same `id(l) == id(k)`, since the
value itself is mutable, when we change it we actually change the list object that both ids point
to. So we have to take care to only use copies of objects like these if we actually want to mutate
one without affecting the other.

```python
l = [1]
m = l.copy()
m.append(1)
print(l, m) # l == [1], m == [1,1]
```

More really good explanations [in this reddit thread](https://reddit.com/r/learnpython/comments/sxu3y2/question_on_pass_by_object_reference_and/hxy0z6w/?context=5#hxy0z6w),
which is also where I took my above examples from.

## Functions keep reference to default argument values

In python, function declarations are run exactly _once_. Whenever the function is subsequently
called, it refers to this single function declaration, and any missing arguments for the function
call are _also_ taken from this single function declaration. This process is generally transparent
to the user: if you have a function providing a default string value, or defaulting to `None` for
one of its arguments, it does not matter where exactly it comes from or is stored in memory.

Just like object references above, where it gets tricky again is concerning _mutable_ variables:
if you provide for example a dictionary or a list as the default value but modify it in one of
your function calls, it will be modified in _all_ of them.

Here's an example of the issue:

```python
def fun(l: list = []) -> list:
  l.append(1)
  return l
```

The first time it is run, everything will go smoothly (returning `[1]`), but from the second
invocation onwards this will fail (returning `[1,1]`, then `[1,1,1]`, and so on).

What you can do in a situation like this instead is to supply `None` as the default value for the
argument and instead create the mutable value _inside_ the function body:

```python
def fun(l: list = None) -> list:
  if l is None:
    l = []
  l.append(1)
  return l
```

This circumvents the issue by instantiating a new list each time the function is called (since
the instantiation is part of the function body which is executed on each invocation instead of
part of the function signature which is only called the one time on definition). It's a little
more verbose, but a good way to hedge against 'silent' issues which only crop up every now and
again. Modern linters come with [rules](https://docs.astral.sh/ruff/rules/mutable-argument-default/)
for this problem that point it out to you.

It is true that this _can_ be considered a feature in certain edge cases (using the default value
as a cached variable for example), but in my opinion you should always view it as a bug (or at
least a 'code smell') when code actively makes use of it. If you want cached values, do so
explicitly, and never rely on this weird little behavior -- that way you also won't accidentally
use the pattern when you actually shouldn't.

The same applies to data classes, where you can make use of a `factory` argument if using a data
class.

## Integer memory caching

Here's a fun one to wrap your head around:

```python
a = 3
b = 3
a == b # True
a is b # True

x = 257
y = 257
x == y # True
x is y # False
```

This is very reminiscent of [JavaScript](https://dorey.github.io/JavaScript-Equality-Table/) is it
not?[^jscimilar]

In fact, it does not have anything to do with type coercion, but is an wonderful showcase for the
concept 'identify is not equality' in python. At its most basic, think of equality as comparing the
_value_ of objects, and identity comparing the memory address _ids_ of objects (see above for
the way python handles values and id references).

```python
s = "hello"
t = "hello"

s == t # True

s is t # False
id(s) != id(t) # True
```

If you understand this concept, you already completely understand the whole concept. But it is
something to recall explicitly sometimes, for harder to understand equality or identity
comparisons.

But while the identity of `x` and `y` was correctly tested as `False`, why did the identity for
`a` and `b` actually return `True`? Going by the above, while the value for both is equal, they
should still have different underlying object ids (unless you do `y = x` to create `y`).

Well, python does some slight bit of magic and stores integers from `-5` and all the way to `256`
always in the same memory ids (per python run). In other words, it 'caches' those values in
memory, to have easy access and save on overall memory as it is assumed these integers will be
used all over the place. Python calls that process 'interning' which is describes in more detail
in this article:
<https://realpython.com/python-is-identity-vs-equality/>

As a bonus, you can override the id of strings to manually 'intern' them with the `sys.intern()`
function.

```python
from sys import intern
s = 'thanks'
t = 'thanks'
s is t # False
s = intern(s)
t = intern(t)
s is t # True
```

This can be used to speed up string comparison (for long strings since you can look up their ids
instead of having to compare the full value).

## Packaging and environment management

Ah, virtual environments. I am including environment mangement here as an issue, but really,
anyone who has programmed in python for a little while _will_ have come across this and packaging
at some point. So it is less of a loaded footgun and more of a checkpoint of shotguns pointed at
each one crossing it at some point in their python journey.

A few years ago we already had somewhat of a 'simple' answer prepared in 'use poetry', and
nowadays the answer generally is just 'use UV' and learn to use it well. I generally concur with
these (having made the same journay myself), but it inevitably awaits every user of python sooner
or later. Venv? Pyenv? Pip? Pipx? Conda? Poetry? UV? How does Hatchling fit into this picture?

I think the fundamental issue here is that most people come across this issue _fairly_ early on in
their python career, and that is a time where most of the answers, advantages and disadvantages of
the different solution paths they could go down do not intuitively have meaning yet.

They apply to mental models which the casual python programmer has simply not developed yet,
but their resulting _uses_ (libraries, packaging, using others' programs) already become crucial
at this point.

Thankfully with the `pyproject.toml` standard and `uv` as a very capable tool we now have
relatively safe defaults to point to, but it remains an issue when loading older libraries and
trying to wrap one's head around `setup.py`, `requirements.txt` and inevitably `venv`s.

## Not knowing how libraries implement features

This one is mostly aimed at data scientists, and users of statistical methods, but applies in
equal measure to each use of a library function. After having learned how to use libraries in the
previous step, now comes the issue of not knowing _exactly_ how these libraries function.

When starting to use a library, it usually happens because it implements some functionality that
you yourself do not want to (or are not able to) implement. For example, we use `numpy` because it
implements multidimensional arrays, but then we often use `pandas` on top because it implements
specifically easy operations on dataframes, or we use `polars` on top because it implements more
streamlined or faster operation chaining, and we use visualization libraries like `seaborn` or
`plotly` on top because they implement all the nitty-gritty graphical details to present our
statistical findings. Any one of these libraries provides functions which I personally often could
not implement in an equally satisfying way, and most definitely do not _want_ to implement in any
way before actually getting down to analyzing my data.

That is, fundamentally, why we use libraries (and why most of us love the extensive python
eco-system). But, without having dug (and dug _deeply_) into the source code of the libraries we
use, how can we be absolutely sure they do what they are supposed to and, perhaps equally
important, what we _envision_ them to be doing?

The 'supposed to' and 'supposed to for my understanding' might diverge if the library creators
come from a different background or have different use cases in mind. This issue only gets worse
when we actually don't _understand_ the exact functionality of the library, or how it diverges
from what we should be expecting for our use case.

One example is written about [in this reddit thread](https://reddit.com/r/statistics/comments/8de54s/is_r_better_than_python_at_anything_i_started/dxmnaef/?context=3#dxmnaef)
for an old issue in the `sklearn` library which did not correctly implement bootstrapping,
and later on removed the functionality. This in turn bewildered some of the more
statistician-oriented users which were variously surprised by the issue, or the treatment of the
function as a second-class citizen.

## Metaclasses

Less of a footgun, and more of a 'what would this be useful for' situtation. If you are content
without them (and in the majority of cases, unless you are writing an OO library project, you will
probably be), ignore them.

But they _can_ be very useful for ensuring that a derived class has certain constraints which are
imposed by its parent/abstract class. You might be using them in your code anyway without
completely realizing, as for example `abc.ABC` is based on metaclasses.

Read more on why the exist in Python history here:
<https://python-history.blogspot.com/2013/10/origin-of-metaclasses-in-python.html>

And watch an in-depth talk on their use-cases and a mental model for them here:
<https://www.youtube.com/watch?v=cKPlPJyQrt4>

[^idsize]: In reality, the ids are often quite a bit larger than the numbers shown here.
         But the principle is the same.

[^jscimilar]: I have to admit that this example also caught me off guard and I had to scratch my
            head for a bit. It is not one I had run across before.
