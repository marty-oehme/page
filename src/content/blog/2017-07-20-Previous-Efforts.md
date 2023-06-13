---
pubDate : "2017-07-20T07:58:06+0200"
linktitle : "Previously"
title : "Previous Efforts"
description : "A run-down of simple entity component games"
weight : 10
tags : [ "ECS", "artemis-odb", "kotlin" ]
---

[rectangle eater]: (https://erikhazzard.github.io/RectangleEater/)
[rectangle eater tutorial]:
  (http://vasir.net/blog/game-development/how-to-build-entity-component-system-in-javascript)
[bomberman tutorial]:
  (http://t-machine.org/index.php/2013/05/30/designing-bomberman-with-an-entity-system-which-components/)
[inventpython wormy]: (http://inventwithpython.com/pygame/chapter6.html)

## Previous Efforts

Over the past few days, I took a bit of time to get myself acquainted with
entity component systems and artemis-odb in particular. I already used it
somewhat in a prototype quite a while ago but I still feel like having only
scratched the very surface of what it offers.

## Rectangle Eater

{{<video mp4="/2017-07-20/RectangleEater-2017-07-20_08.56.49.mp4">}}

I started off with a very simple quasi-port of Erik Hazzard's [Rectangle
Eater][rectangle eater]. He originally coded it in Javascript and delivered a
[brilliant tutorial][rectangle eater tutorial] alongside it. If you have never
heard of entity component systems then this is a brilliant starting point.

I did only get my inspiration from the idea - I really think rectangle eater
should be game development's 'Hello World' - and started working on it without
looking at the original code, so mine looks and plays a little different. But I
am also mostly happy with the results of it all. It allowed me to get to grips
with artemis-odb's little quirks - especially since I coded the game itself in
Kotlin.

The game concept lends itself beautifully to an entity component system
trichotomy: Rectangles are entities, their position, size and color are
components and the way they shrink and collide with the mouse are systems. It
makes it easy to conceptualize what each part of an ecs does. At the same time,
only following this concept, I believe care has to be taken not to get too hung
up on the idea of entities always representing concrete in-game entities. This
is in fact one of the problems I believe I had with my attempt at the next game.

## Nibbles

{{<video mp4="/2017-07-20/Snake-2017-07-20_09.25.15.mp4">}}

Originally presented in [Invent with Python][inventpython wormy] to show fun
stuff to do with that language (well, originally presented waaay back on my
brick of a Nokia phone), I thought this might be a good opportunity as the next
little project to broaden my understanding of ecs. Unfortunately, I believe that
with the way I structured and coded this game I really did not do a good job
making use of the strengths of ecs. There are three overarching problems
plaguing this prototype: It is very unstable due to a poorly implemented
parenting system, most systems run every frame even though the snake only moves
every so often and my overall separation into entities and components could be
better.

### The Inefficiency

Nibbles only moves every .5 seconds. The app itself runs at around 60fps. That
means There are 29 frames ('ticks') that all of the systems dealing with logic
should really be able to rest. My systems however, run all the time. Every
system, every frame - except for the one that actually moves the snake.

In artemis-odb you can create
[`IteratingSystems`](https://github.com/junkdog/artemis-odb/wiki/IteratingSystem),
which simply iterate over all the entities which they contain, or
[`IntervalIteratingSystems`](https://github.com/junkdog/artemis-odb/wiki/IntervalIteratingSystem).
These systems only run every so often and I passed in .5 seconds for the
movement system. I believe a much more practical approach, without creating too
much inter-dependency (which I am still struggling with) is to refactor the
systems to be invoked by an event system. To that end, it might be useful to
create a `TurnSystem`, which fires every time a 'turn' is up (snake is
essentially slow enough to call game steps turns, right?). Maybe `StepSystem` or
even `UpdateSystem` would be better, but I like calling them turns, since it
clearly marks them only being called every so often and also delineating between
the actual game updates (rendering every frame etc) and what happens logic-wise.

Artemis-odb features
[custom system Invocations](https://github.com/junkdog/artemis-odb/wiki/InvocationStrategy)
that seem perfect for this sort of thing. I have not delved into them yet,
however, and they also seem somewhat complicated to get your head around.
Another idea might be to use the more drop-in solution of
[an artemis-odb eventbus](https://github.com/DaanVanYperen/artemis-odb-contrib/wiki/EventBasics)
which gets automatically injected into the systems. Then, all the `TurnSystem`
has to do is dispatch an `EndTurnEvent` and all systems that have implemented a
listener can use this as their update function, or their getting-going function
or even reset function, whatever fills the needs best. (Think for example of a
system that updates every frame but gets reset by a new turn - an animated clock
showing when the snake next moves for example.)

### The Parenting System

Currently, the game has no real notion of parenting. That is mostly because I
wanted to avoid any finagling with deprecated entityIds. Here's the quick
rundown of what I gathered:

Artemis uses simple `Int` values as their entities. That means, it essentially
turns the concept of entities containing components around and has each
component contain an id that tells it which entity it belongs to (as many ecs
systems do). This is very efficient, fast and makes lookup for the systems a
breeze.

But what happens when an entity gets destroyed? Well, the components get
notified and destroyed. (Remember, the entity itself is only an id attached to
the components.) So, if one component needs to reference another - say the
position of a parent entity - then simply storing that id as 'parent' will work
as long as no entities get destroyed, but then it might point to a completely
wrong entity - or null. There is a way to counteract this in artemis-odb called
[Managed Links](https://github.com/junkdog/artemis-odb/wiki/EntityLinkManager)
and used by annotating the field referencing an id with `@EntityId`, which does
all the referencing and nulling for you, but I wanted to keep it simple and
without including too much advanced concepts for this little game. Also, it
would need to include another artemis plugin to not slow down the system. This
makes little difference for our little snake clone, but is hugely impactful in
larger systems.

So, how am I doing it now? Nibbles is made up of many entities that all contain
the `Body` component, as well as a `GridCoordinate` component representing their
position in the game.

```kotlin
data class Body(var index: Int = -1, var shouldGrow: Boolean = false): Component()
data class GridCoordinate(var x: Int = 0, var y: Int = 0): Component()
```

Each body component contains an index number that tells us its position along
the snake (Head is 0, Next is 1, the Tail is the last element). This generally
works well and lets us create a system iterating through all the entities with a
body component and do something with them. The doing something with them is
where things get a little more complicated, however. Let's take a look at the
process function of the `BodyFollowSystem`, which acts as a
kinda-sorta-parenting system.

```kotlin
override fun process(entityId: Int) {
        val body = CBody[entityId]
        val index = body.index
        val myPos = CPosition[entityId]
        val parentPos = positions[index-1]

        positions[index] = Pair(myPos.x, myPos.y)

        if (index > 0 && parentPos != null) {
            val deltaPos =
              Pair(parentPos.first - myPos.x, parentPos.second - myPos.y)

            CMovement.create(entityId).direction = when {
                deltaPos.first > 0 -> Direction.RIGHT
                deltaPos.first < 0 -> Direction.LEFT
                deltaPos.second > 0 -> Direction.UP
                deltaPos.second < 0 -> Direction.DOWN
                // is never reached
                else -> Direction.LEFT
            }
        }

        if (body.shouldGrow == true) {
            body.shouldGrow = false
            grow = grow.copy(true, grow.second)
        }

        grow = grow.copy(grow.first, CMovement[entityId].direction)
    }
```

It iterates through the body parts, starting from the head and moving to the
tail. It carries an internal `positions` Array, that is filled with the
positions of the body part. Then the system looks at the position of the body
part with an index one lower than itself and calculates the difference in
positions. Depending on in which direction the other index differs it creates a
`Movement` component on the entity with the position it wants to move in. For a
hacky prototype this kinda works, but it has problems.

{{<video mp4="/2017-07-20/Snake-2017-07-20_09.23.06.mp4">}}

First of all, the system now carries state all of a sudden (with the `positions`
array). Generally, you want to avoid giving internal, mutable variables to the
systems itself as much as possible.
Also, the system really does not know how to deal with positions of the 'parent'
that are not right next to an entities current position. It will continue
passing along a direction - even though that is not at all how the bodypart can
stay attached to its parents movement.

This makes the system highly unstable, and we see a bug resulting from it in the
animation above - the new body part would be placed outside the map, which is
prohibited by another system (`BorderSystem`, which creates walls outside the
play area that the snake can not move into). The other system places it toward
the closest position possible instead and suddenly the child-parent connection
is already broken, as it creates false movement in the part.

How could this be prevented? For one, the system could check the parent entities
movement direction and set this Body parts position to
`ParentPosition -1 in current MovementDirection`. Or, it has a fail-safe built
in for detecting when the difference between positions becomes greater than 1
and then it resets the Position to a reasonable one next to its parent. These
are panaceas however. I believe the problem here lies not in how this system
operates itself (though it is inefficient in its own right), but in how I
structured the entities and their components in general.

### The Components

```kotlin
class GridCoordinate(var x: Int, var y: Int)

class Image(filename: String, var texture: TextureRegion)

class Body(var index: Int, var shouldGrow: Boolean)

class Apple

class KeyboardInput(var left: Int = Keys.LEFT, ... -SNIP- )

class Collideable(var effect: CollisionEffect)

```

These are all my components. And they are kind of a mess. Apple has been reduced
to a mere tag after some rewriting of the `DisplaySystem` and every Body
contains the `shouldGrow` variable, even though only the last segment of a snake
really ever 'grows' and the snake `Body` and `GridCoordinate` kind of want to
get at the same thing in different ways. Luckily, ecs really lend themselves to
internal restructuring, so let's think of some ways we could rearrange these
things.

Since the snake is one complete package - whenever something happens to it, all
of it is affected - it might be worth thinking about making _all_ of the snake
one entity. As mentioned above, the snake itself is made up of many entities
which all contain a `Body` component right now. Another way to structure this
would possibly be to have the whole snake be one single entity, and `SnakeBody`
be a single component on it which contains a list of all the positions of its
segments.

```kotlin
data class SnakeBody(var Segments:Array<Position>)
```

This would let us create a `BodyFollowSystem` which does essentially the same
thing as our old system, but does not have to iterate through all the single
entities twice (once getting their location, once setting their location) but do
it in one go. It would thus make it easier for the snake segments to follow
themselves. You just set it to the position of the previous segment for all
except the first array element. The first array element should be the position
of the head.

One problem that becomes quickly visible is that we are tightly coupling the
snake body segments - so tightly in fact that they don't exist other than in the
complete `SnakeBody` Component. This also makes things like drawing and
collision easy in the short run - simply draw an image for every entry in the
array, same deal for collision - but makes this concept really not universally
usable. If the image for rendering usually comes from an `Image` Component (as
is the case here), we have to create exceptions and special cases within the
draw system. We could circumvent that again by using another draw system just
for the snake, but I don't believe an extra system for just the one entity
really pays off.
Finally, what if there were to be a powerup that makes one of the snakes'
segments able to be passed through? This simply would not work without
restructuring the `SnakeBody` Component itself in our case. It goes against the
idea that we want to couple as little as possible in ecs, allowing component
reuse and flexibility.

Another idea would be to somehow pass the intended position to each child
segment before it simply moves there. This comes close to emulating a parent
child relationship without needing any Managed Links between entities. One way
of doing that is letting a system iterate over all child segments and passing
them a new `GridCoordinate` by taking the parents' position and subtracting its
`Movement` Component direction. Movement in this game really is only a direction
and the movement system moving the entity along the grid in that direction.

Questions like these are really at the core of getting more out of ecs. Sure,
this is an exceedingly simple example but it demonstrates the idea of
reusability and how abstract you want to go pretty well. One really good
tutorial for this restructuring workflow is [this bomberman
tutorial][bomberman tutorial], which covers some more of the conceptual design
side of ecs.
