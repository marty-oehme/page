---
title: "Flexing your Browser Game Loop"
pubDate: "2018-05-21T08:52:57+0100"
description: "5 different approaches to creating game loops"
weight: 10
tags:
  - dart
  - programming pattern
js: ["/2018-03-21-gameloop/main.dart"]
---

## Game loops in the browser

While games come in all shapes and sizes, one feature is common to pretty much
all of them; one that is even common to everything from graphical applications
like your Office suite, the operating system you are interacting with, the
browser you are probably reading this paragraph on just now: they need a loop
which runs your inputs and shows the corresponding outputs. Just, for games
there is no stopping in between, no waiting for you to give the next command to
generate the next output. Those settlers are going to continue chopping wood
while you sit there, sipping your tea. Except for turn-based games, where the
game actually will wait for your next decision. Except, usually, it will still
display and animate that nice, lush world while waiting for your next move of
genius. Except, some games actually won't have any animations to play while
waiting for your input and would rather save phone battery while you decide how
to best match 3 gems together. Really, game loops come in all shapes and sizes,
just like games themselves.

However, as with most things programming, the general quintessence of what makes
this connection tick can still be abstracted into a general concept – a
[programming pattern](http://gameprogrammingpatterns.com/game-loop.html), if you
will. Quite a lot has been written about different patterns over the last few
years especially; of note here are especially the Gafferongames article about
[fixed timesteps in game loops](http://gafferongames.com/game-physics/fix-your-timestep/),
and deWitters' article on
[different game loop ideas](http://www.koonsolo.com/news/dewitters-gameloop/).
What we want to do here is use the three articles as a foundation, and see how
we can implement it in dart with the browser event loop wrapping around it. Most
of the example code is simply adapted from Nystrom's page on game loops to fit
into the requirements of dart. If you would rather see an implementation in
javascript,
[this article](https://isaacsukin.com/news/2015/01/detailed-explanation-javascript-game-loops-and-timing#first-attempt)
goes into a lot of depth as well.

## Indeterminate Time, Indeterminate Everything

First, let us take a very quick look at the variations of game loops themselves
and why you would want these options. If you want to get more in-depth
information on the pros and cons and concepts behind the loops, again I strongly
urge you to take a look at Bob Nystrom's Game Programming Patterns linked above,
where he goes into much more detail.

```dart
// Example Code from GameProgrammingPatterns
void main() {
    while(true) {
        update();
    }
}
```

This is the most simple a game loop (or any application loop, really) can get.
It simply gets called through a main function and then continuously runs updates
of your app. It does so at whatever speed the cpu you are running on can muster.
First of all, you don't know how fast your loop is actually going - how much
time is passing between every call to it. That spells trouble if you want to
employ things in your game which count on knowing that - say you want to display
a time, or have anything run on a timer. It also means the game runs at
different speeds. If not a lot is going on which has to be computed and rendered
it will run lightning-fast, and as soon as the action is heating up, the game
will invariably slow down. It will slow down different magnitudes for different
systems, so if you think about building a fast-paced game of skill, someone with
a slower computer will have an easier time since the whole thing will run slower
for him.

Here is where the idea of game loops running on a time-frame they know comes in
handy, and we generally have two ways of going about it: **We can either tell
the game to only update every so often, or we can, as before, let the game
update on its own, but inform it of how often this is happening.** This is the
key distinction between the different loops and one which is employed for
different means and ends when it comes to computing the logic and rendering of
your game.

Now, these are the basics of game loop manipulation as you can read in most
engine programming books and we will quickly go over them in some more detail in
a moment, but it is important to keep in mind that we are talking about game
loops _in the browser_. And in a browser a simple game loop as above would
already work slightly different than what I just told you. See, when the loop is
running, it blocks everything else - anything you don't implement _within_ the
update loop will be blocked from working correctly. [^1] The browser tends to
not allow this. Or at least, it is not really ideal for the user's game
experience if everything is stuck because of your code. That's why many browsers
have an error windows pop up when a certain script has been stuck running on its
own for too long - say, running a continuous update loop. Instead, we will make
use of an `animationFrame`.

The examples on this page all follow the same idea: There is a grid of colors
which, on every game `update`, colors the next square a slightly more intensive
color; or colors a random square a random color. You can switch between the
modes with the random button. When we render the grid, we also go back and forth
between slightly darkening and lightening the image. This is done in the
_rendering_ step of our examples, which will become useful later on when looking
at the differences between updating and rendering.

>  <center><div id="while_loop"></div></center>
>
> This is a randomly coloring grid, using the simplest form of a game-loop.
> Rendering and updating is the same, and there is no specification for a
> certain update-speed. This is essentially the while-for loop from above.
> The code for the loop can be found
> [here](https://gitlab.com/marty.oehme/browserloops-examples/blob/master/lib/src/02-AnimationFrameWhile.dart);
> [^2] look at the `eventloop` function to understand the loop. `eventloop`
> calls itself as soon as the browser is willing to give it some time again.
> You may see some artifacts during rendering, this is due to the fact that
> it just goes as fast as the browser allows and `animationFrame`s can get
> stuck, or it does not sync to your monitors refresh rate. This method
> can work well for small animations and games – but when the program gets
> bigger, you probably want more control over your central loop.

## Variable Time Step

Really, we did not implement the most basic update loop in the browser. What we
did up above might seem like the most basic way to go about it, but it is
already slightly more advanced. Because what `animationFrame` is doing is
automatically keeping track the time. every call to
`requestAnimationFrame(myUpdatefunction)` gives one parameter over to your
function: the result of a call to
[`performance.now()`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)
which is a
[DOMHighResTimeStamp](https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp)
of the current time.[^3]

This ‘current time’ is not the date, year, day or time when you call the method,
but an arbitrary number which continually ticks up at _a constant rate_ as long
as your script is running.[^4] The constant rate is what is very important for
us. If we look at the loop above, it is simply running as fast as it can without
really knowing how fast that is. If we use the results of this parameter
however, we can also tell our loop how fast it is working.

```dart
// Example Code from GameProgrammingPatterns
void main() {
    double lastTime = performance.now();
    while(true) {
        double currentTime = performance.now();
        double delta = currentTime - lastTime;

        update(delta);

        lastTime = currentTime;
    }
}
```

By taking calculating how much actual time has passed between our updates, we
essentially pass on how long our last update actually took in real time, meaning
the amount of ticks the performance function went up. This means we still run as
fast as we can, but now we _know_ how fast that is, and our update function can
adapt its speed accordingly. Want to make a box move by 1 pixel per second? Make
it move by

`1px * delta/1000`

and voilà, it adapts to how fast updates are calculated. It takes the movement
and multiplies it by however much of a second has actually passed between the
last updates. Obviously, the example code above is reverting back to a
while-loop, not our animationFrames. So, let's see an example of how it looks
implemented in actual dart code:

> <center><div id="variable_timestep"></div></center>
>
> This example looks the same as the one above, and it still runs as fast as the
> browser allow. Crucially, it now knows how fast that is. So, when you change
> the slider, it will change the that the color squares change. Moreover, by
> knowing how fast it runs, the update function can manipulate the color change
> value, so it will change colors _at a constant speed_, it does not matter how
> long individual updates take. This would not be possible with the the
> while-loop up above. Code for the loop can be found
> [here](https://gitlab.com/marty.oehme/browserloops-examples/blob/master/lib/src/03-VariableTimestep.dart).

This is the first way to deal with different looping speeds. You can read the
advantages and disadvantages elaborated in the articles mentioned in the
introduction. If you don't want to go that in-depth, keep in mind that this way
of looping works well, but you have to remember to settle everything which
happens over a time-span with the time delta that is passed in, and it does not
support deterministic game play very well.[^5] We let the game know how fast it
is looping, and where necessary adjust all its animations and updates on its own
accordingly - the frame-rate fluctuates, but it accounts for that by being
_variable_.

## Instituting a Fixed Time Regime

Let's go one step further now. We want to go beyond a simple call to update
whenever the browser deems it fit. What we want to do instead is dictate when we
update _for our self_ - we want to implement fixed time step. Implementing such
a fixed step is not too hard. We simply tell the update loop to wait a certain
time (however often we want to update per second) before executing itself again.

```dart
MS_PER_UPDATE = 1000 // update once per second only

void main() {
    double last = performance.now();
    double lag = 0;
    while (true) {
        double current = performance.now();
        double delta = current - last;
        last = current;
        lag += delta;

        while(lag >= MS_PER_UPDATE) {
            update();
            lag -= MS_PER_UPDATE;
        }
    }
}
```

In a sense it is very similar to what we did up above, only in reverse. There,
we let the update code know how much time passed between updates and deal with
it. Now, we simply deal with how much time passes on every update by fixing it
before we ever call the update code.

We do so by getting the amount of _real_ time which has passed between updates,
just like in the variable time solution. We don't just call our code with it
though. Rather, we add all of this elapsed time into a number (here called
`lag`). This is how much the update lags behind real time. If called once, it is
simply delta time. But we only call the update method (and thus reduce how much
our updates lag behind) once all the time we set to a fixed value has passed.
So, if we only want the loop to update once every second, we simply pass in that
we want 1000 `MS_PER_UPDATE` and the inner loop, the one calling update, will
not run until lag has accumulated 1000 ms. If our machine is fast, this means
the outer loop will run many times and each time add a few ms to our lag value,
then, once we cross the 1 second threshold, it finally calls update and reduces
the lag value by the amount of time it waited.

It does not set lag to 0, since there is bound to be some residual lag left
over. It also means that, if our last delta was _greater_ than our desired
`MS_PER_UPDATE`, the lag will similarly be bigger than the desired value and
run. If lag is a lot larger, it will update several times, until it has caught
up to within our desired margin. In a sense, you can think of `MS_PER_UPDATE` as
the desired margin of error of our game updates lagging behind the real world.
Set it high and it will update infrequently - good if you don't _need_ a lot of
updates per second or want to conserve battery, bad if you introduce choppiness
to the game. So, find a value that updates enough for your game to make sense
and set it to that. A recommendation I have often heard for fast paces games is
around 20 updates per second (`MS_PER_UPDATE` of 50), but it really depends
entirely on your game and targeted hardware.

First off, this means we only have to set this time once and not have to
remember to do so in every nook and cranny of our update method - we have
_fixed_ the amount of time each step takes (‘steps forward’, if you want to look
at it that way). There are some problems left however. If you set the ms too
high, not only will the updates come farther in between, but the display updates
will also only happen every second for example. This is probably not what you
want. Secondly, if the updates itself take longer than your desired ms per
update - well, you have created an infinite loop of your update method trying to
catch up and just not managing to do so.

## Separating Concerns

So, before we implement our new work in dart, let us try to fix these problems.
First off, we want to separate the `update` ticks and the times the data is
displayed. This is simple enough to do by splitting out our game logic into an
`update` method, and all the stuff that displays the results to us into a
separate `render` method. Put the render method outside the loop catching up
with our time by calling update a bunch, and we still update at a fixed time
step, but render at whatever speed our machine can muster. Obviously this also
means that we should definitely not put any logic code into our render method
anymore, or we are back to square one.

```dart
void main() {
    while(true) {
          // lag calculations //
        while(lag >= MS_PER_UPDATE) {
            update();
            lag -= MS_PER_UPDATE;
        }

        render();
    }
}
```

Another possible problem is that when we finally render, the update method might
have run multiple times, or it might not have run at all. If it did not run at
all, we just display the results of the last update again. But if we then run
it, all values jump forward their respective speeds per ms. Then we render the
new values. What if the gap between them is big? Rendering seems ‘jumpy’, since
we never display any of the in-between values. This gets even worse, if we
display one update at the very edge of the desired lag (say, we want to update
every second and render at .98 seconds); or the next lag might even cause our
update method to trigger twice. To fix that, or at least counteract it, we can
pass our current lag into the render method. And if we not only pass the lag
itself, but `lag / MS_PER_UPDATE`, we have a value between 0 and 1 which shows
how far along to the next update we are. Our render method does not need to know
any specific update lag or how many times per second we are trying to update.
But now it knows how far along we have come and can adjust the render targets
accordingly (for example by taking an object's position and adding its current
velocity multiplied by how far we are between updates). We are thus
_interpolating_ the shown positions of objects. Sometimes, after collisions for
example, these values will not be quite true for the actual next update, but
this is hardly ever noticeable. If you think back to variable updates, this is
essentially what we are doing for the render function now, only not with a
specific delta value, but with a percentage showing our in-between state.

```dart
void main() {
    while(true) {
          // lag calculations //
        while(lag >= MS_PER_UPDATE) {
            update();
            lag -= MS_PER_UPDATE;
        }

        render( lag / MS_PER_UPDATE );
    }
}
```

If we additionally want to set a maximum frame-rate that we want to render at,
we can simply set a condition to only call the render method when our
accumulated lag has reached a certain threshold. We are not quite putting it on
a rigidly fixed update schedule, but set a minimum amount of real time between
each re-render and just null the rest once it has been rendered (by keeping
track of a separate render lag).

```dart
if (renderdelta >= MS_PER_FRAME) {
    render(lag/MS_PER_UPDATE);
    renderdelta = 0;
}
```

Finally, we have the potential problem of our update method not being able to
catch up if the desired `MS_PER_UPDATE` are smaller than the time an update
takes. Here, we have to decide what we want to do. We can _skip_ updates or try
to somehow combine multiple update steps into one, should that happen. But then
we introduce some amount of indeterminism again.[^6] Otherwise, we can create a
safety-check to stop attempting to update and giving the user an error message,
for example. Best thing to do is try to set our desired ms to a value which can
be reached without this becoming a problem in the first place. Second best thing
to do is implement a safeguard which, if exceeded simply steps us out of the
update loop. You could make this safeguard time-based by creating another 'lag'
counter for the inner loop. Or more simple, just make it be based on iterations,
and when it iterates too often your safety mechanism breaks out of the loop. The
game will slow down, as if we were back to the very basic loop. (Which is not
good but better than not being able to do anything.) We could also simply pause
for a bit, or even just show a warning to the player. There are many ways to
handle the situation, but generally they all start by implementing a safeguard
for the loop.

```dart
double execNumber = 0
while(lag >= MS_PER_UPDATE ) {
    execNumber += 1;
    if (execNumber >= SAFETY_GUARD) break;
    update();
}
```

## Implementation in Dart

All that's left to do now is implement these ideas in dart. In general, we can
do an almost one to one translation of the above code snippets. There are some
important things to keep in mind however, mostly to do with the browsers
peculiarities around `animationFrame` and `setInterval` implementations. The old
way to create loops such as they are used for games used to be repeated calls to
`setInterval` and then a specific method. However nowadays the recommended
method involves requesting `animationFrames` instead. So if you are not
targeting a really old browser, chances are you also want to make use of this
method.[^7] There are two peculiarities of the dart implementation to keep in
mind, as opposed to a similar javascript one.

We have the utility function `StopWatch` within our core dart libraries, which
helps us easily keep track of the elapsed time. This is not strictly necessary,
we can of course still use time steps in the various callback loops, it is
simply a comfortable way to keep time, which probably also makes our code a bit
easier to read. Secondly, the dart implementation of `animationFrames` uses
Futures, which is a feature very core to dart's async implementations and we can
make use of this as well.[^8]

```dart
  void process(num now) {
    _drawLag += _elapsed.elapsedMilliseconds;
    _updateLag += _elapsed.elapsedMilliseconds;
    _elapsed.reset();

    while (_updateLag >= _MS_PER_STEP) {
      if (_elapsed.elapsedMilliseconds > SAFETY_TIMEOUT) {
        // this is just an example - usually you want to error out here
        // or handle the error in some way
        print("ERROR STUCK IN UPDATE LOOP");
        break;
      }
      if (running == true) update();
      _updateLag -= _MS_PER_STEP;
    }

    if (_drawLag >= _MS_PER_FRAME) {
      render(_updateLag / _MS_PER_STEP);
      _drawLag = 0;
    }
  }
```

This, then, leads us pretty much to the final product of our efforts:

> <center><div id="fixed_variable"></div></center>
>
> The update slider now controls the speed of the _overall updates_[^slowmo]. If
> you take a look at the code you will see that we do not have to multiply this
> speed by an arbitrary amount of deltaTime anymore. We can be certain it is the
> same rate of updates throughout, since we fixed the update rate. Also,
> rendering now runs independently of the updates, and it still runs as often as
> the browser will allow it. Code for the loop can be found
> [here](https://gitlab.com/marty.oehme/browserloops-examples/blob/master/lib/src/04-FixedLoopVariableRender.dart).

## Advantages of the Browser Canvas

The examples we looked at so far, and the book chapter by Nystrom they are based
on, assume your code has to update and render everything each frame (or
update-tick) in order to work. And they certainly do, whenever anything changes.
But the beauty of operating in the browser is that a lot of what we would need
to achieve manually when coding from scratch has already been implemented for
us, as we saw with `animationFrame`. The following addition will mainly be
useful for you if the largest portion of your rendered elements does not change
from frame to frame. We are not drawing directly to any render target on the
hardware which would need to be refreshed all the time just to display a static
image.[^9] Instead, we are rendering to the canvas. And the canvas, in general,
already takes a lot of responsibility for correctly displaying whatever it is
supposed to – which includes continuously displaying whatever you told it to at
one point. Really, it is more akin to ‘drawing’ something on and then forgetting
about the underlying implementation (hence, canvas). So how does this help us?
Right now, we are completely removing and rendering the contents of the whole
canvas every single render pass. Often that is what you want to do, but
sometimes – in more static games, or animations that don’t continuously move –
you only want to re-render when stuff has actually _changed_. That is what we
want to do, since _drawing_ new stuff on the canvas tends to be expensive, but
the actual behind the scenes _rendering_ of whatever you drew on tends to be
optimized very well.

```dart
  void process(num now) {
    _drawLag += _elapsed.elapsedMilliseconds;
    _updateLag += _elapsed.elapsedMilliseconds;
    _elapsed.reset();

    while (_updateLag >= _MS_PER_STEP) {
      if (_elapsed.elapsedMilliseconds > SAFETY_TIMEOUT) {
        // TODO stub - give warning etc when this occurs
        print("ERROR STUCK IN UPDATE LOOP");
        break;
      }
      if (running == true) update();
      _updateLag -= _MS_PER_STEP;
    }

    if (_drawLag >= _MS_PER_FRAME) {
      if(dirty) {
          render(_updateLag / _MS_PER_STEP);
          dirty = false;
      }
      _drawLag = 0;
    }
  }
```

The only change we made to the code above was to add a single check before
calling the `render` method. The change to make this work, however, is more
involved than just setting a variable render speed, or decoupling rendering and
updating as we did above. Indeed, _every_ **visible** change in your app needs
to inform the loop of the need to re-render. In other words, whenever anything
changes in your world, your animation, your ui, really, anything that the user
then sees, we mark our rendering pipeline as `dirty` and the loop will once
again render it (as soon as your maximum frame rate per seconds calls it again,
if you have set one). As long as nothing _visible_ has changed in your world,
the previous render is still perfectly valid for this round, can be marked as
clean, and we don’t have to redraw anything on the canvas – it will
automatically get re-rendered behind the scenes, much more efficiently than if
we were to manually repaint it.

> <center><div id="dirty_flag"></div></center>
>
> This example uses dirty flag rendering and _only_ sets the flag to dirty when
> a square actually changes color. The small color oscillations are deliberately
> set to not trigger a re-render, in order to make the change more obvious. In
> other words, with the default update speed of twice every second, this example
> also only _renders_ twice per second, since at no other point does anything
> change in the program. That is a huge efficiency boost. You can see the change
> in the color oscillation which seems much more jumpy than before. In a
> real-world application, you would usually include changes like the oscillation
> in the update loop as well, as mentioned above when talking about separating
> the pipelines. Code for this loop can be found
> [here](https://gitlab.com/marty.oehme/browserloops-examples/blob/master/lib/src/05_DirtyFlagRendering.dart).

The only issue left to solve is how you then transport that change from dirty
throughout your program to the overall render loop, and for that you will need
to think about the way your whole application is structured to find a solution
fitting for it. I really don’t believe there is a one-size-fits-all solution to
this specific problem, especially since it concerns your overall program
architecture. One last time, I will recommend the exemplary
[gameprogrammingpatterns’ discussion](http://gameprogrammingpatterns.com/dirty-flag.html)
on this, only slightly related issue. You could, in theory, even go another step
further and _only_ re-render the stuff that changed (as well as the stuff that
is now where the stuff that changed was, or you will get something akin to the
old
[solitaire victory screen](https://mrdoob.com/lab/javascript/effects/solitaire/)).
But that is really beyond the scope of basic browser game loops.

## Putting It All Together, or: Skip the Rest, Implement the Best

After all the discussions and slight detours we took to get here, let’s take
stock of what we have. We have a continuous call to the browser, as soon as he
will allow us while still achieving reasonable performance itself, in the
`animationFrame`. We have decoupled our updates and our rendering from each
other. We have fixed the interval between each single update in our world so
that we can be deterministic and our physics don’t go haywire. We are rendering
our world as often as we can, or up to a maximum desired frame rate, while being
variable in how often that is. We fixed the potential problems of jumpy
rendering through interpolating, and infinite update loops by throwing an error
beforehand. And lastly, we are only re-rendering our scenes if anything visible
actually changed from the last time we painted it all up on the screen. All of
this leaves us with the following, idealized code:

```dart
Stopwatch _elapsed = Stopwatch()..start();

void process(num now) {
    _drawLag += _elapsed.elapsedMilliseconds;
    _updateLag += _elapsed.elapsedMilliseconds;
    _elapsed.reset();

    while (_updateLag >= _MS_PER_STEP) {
      if (_elapsed.elapsedMilliseconds > SAFETY_TIMEOUT) {
        print("ERROR STUCK IN UPDATE LOOP");
        break;
      }
      if (running == true) update();
      _updateLag -= _MS_PER_STEP;
    }

    if (_drawLag >= _MS_PER_FRAME) {
      if(dirty) {
          render(_updateLag / _MS_PER_STEP);
          dirty = false;
      }
      _drawLag = 0;
    }
  }
```

With the corresponding `update` and `render` methods looking somewhat like the
following:

```dart
update() {
    onClick() => moveUnit();
    if(unitMoved) dirty = true;
}
render() {
    drawUnitsOnScreen();
}
```

Well, that is essentially it. It’s not complicated, really, but there are a lot
of moving parts.

I hope this further demystifies some of the ideas that go into decoupling
rendering and update pipelines on the one hand, and the browser update loop on
the other. If you stuck with the whole article, congratulations and thanks – it
turned out longer than expected. If you skipped to the part marked _skip to me_,
I hope it makes sense without the preamble. If I ever find the time, I would
like to clean up some of the example code on this page – if you want to pitch
in, by all means feel free to do so. All code can be found
[here](https://gitlab.com/marty.oehme/browserloops-examples), just do your best
ignoring the hacky bits wiring it up to the examples on this page. In the
unlikely event of me finding even more time, I would also like to wire up some
tests and profile the loops, so that we can work with more guarantees of
everything working as it should. Until then however, I do hope the examples as
they stand help clarify some remaining issues around working with the browser
animation-loop, and how your can use it to power your games.

[^1]: Well, mostly anything. Usually, the operating system your program will run on will also have a say in the matter of how much can be blocked. It is difficult to convince the Linux shell and kernel to give full attention to your program alone and not poll updates from your input devices, for example.
[^2]: Note that the code for this loop does not use the preferred dart-idiomatic way for `animationFrame`s. As we will see later, the preferred method is doing it through dart `Futures`. But the idea in this example is to keep this loop as simple as possible to grok the concept of the loop, not necessarily the dart-specific implementation.
[^3]: Note that whereas this time stamp used to be accurate in the realm of microseconds, ever since the [Spectre](https://spectreattack.com) vulnerabilities were spreading at the beginning of 2018, the time-resolution is a bit worse. The mozilla developer page says it is rounded to roughly 2ms by Firefox. I do not know how much Chrome rounds its results. This _will_ have an impact on the accuracy of simulations, though in the context of an update loop such as this it should still be negligible.
[^4]: The number is not really arbitrary, but started from 0 when either the web worker is started, the last page is closed or the page is navigated to and then ticking up at a constant rate. This really does not matter for purposes of frame-rate, however.
[^5]: If you don't know what determinism in games is, you probably don't have to worry about having it. Determinism gets important were you to implement real-time multi-player, sometimes also to have an easier implementation of replays and saves mainly. Overall, it simply makes the behaviors in your game more predictable.
[^6]: You might attempt to double the values that would be created by one update step to catch up. But essentially then you are creating some form of variable update stepping again - which might work, if your game is constructed for it and you absolutely need it.
[^7]: You can see the supported browsers [here](https://caniuse.com/#feat=requestanimationframe). Some of the benefits are that the animation frame rate will be roughly targeting 60fps, whatever the device it is running on supports, as well as usually not updating when the containing tab is not in the foreground anymore.
[^8]: In the examples throughout this page, we do _not_ make use of Futures, instead calling `id = window.requestAnimationFrame(ourCallback)` since this method returns a unique id we can use to en stop the loop. This helps for our specific case where we have multiple example loops on one page and we want to switch between them. Generally it is recommended by the dart team to use the Future returned by `animationFrame` instead. Read more in the APIs [here](https://api.dartlang.org/dev/2.0.0-dev.69.0/dart-html/Window/animationFrame.html).
[^9]: Which is what you would otherwise have to do, depending on the refresh rate of your monitor.
[^slowmo]: This is how you could, for example, create slow-motion or speed up time in your game. But to do so you would also have to strictly obey the separation of updates and rendering, into gic and display. Otherwise some things would run faster while others would not.
