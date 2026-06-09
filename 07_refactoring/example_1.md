### Background
This is from a second semester project using Flutter to create a game. It had almost everything inside one large `_HomePageState` class, except the other objects. It handled player, enemy, and coin position, as well as collision detection, respawning, user movement, resetting the game, and building the UI.

### original code

```dart
class _HomePageState extends State<HomePage> {

  static double charX = -0.5;
  static double charY = 1;
  static double skeleX = 0.5;
  static double skeleY = 1;
  double coinX = 0;
  double coinY = 0.7;
  double time = 0;
  double height = 0;
  double initialHeight = charY;
  String direction = "right";
  bool running = false;
  bool jumping = false;
  var font = GoogleFonts.pressStart2p(color: Colors.white, fontSize: 25);
  double life = 5;
  double coin = 0;

  void checkSkeleCoin() {
    // skeleton collision
    if ((charX-skeleX).abs()<0.05 && (charY-skeleY).abs()<0.05) {
      setState(() {
        skeleX = 100;  // set out of 1 to remove it
        life -= 1;
      });

      // Respawn
      Future.delayed(Duration(seconds: 2), () {
        setState(() {
          skeleX = -0.8 + (1.6 * (Random().nextDouble()));
        });
      });
    }
    // coin collision
    else if ((charX-coinX).abs()<0.05 && (charY-coinY).abs()<0.05) {
      setState(() {
        coinX = 100;  // set out of 1 to remove it
        coin += 1;
      });

      // Respawn
      Future.delayed(Duration(seconds: 2), () {
        setState(() {
          coinX = -0.8 + (1.6 * (Random().nextDouble()));
          coinY = -0.7 + (1.6 * (Random().nextDouble()));
        });
      });
    }
  }

  void preJump() {
    time = 0;
    charY = initialHeight; 
  }

  void jump() {
    if (jumping==false) {  // no double jump allowed
      jumping = true;
      preJump();  // reset everything to starting location when user clicks jump
      Timer.periodic(Duration(milliseconds: 30), ((timer) {
        time += 0.02;
        height = -3.5 * time * time + 5 * time;

        if (initialHeight - height >= 0.99) {  // prevent character from "sinking"
          jumping = false;
          setState(() {
            charY = 1;
          });
          timer.cancel();  // so the character doesn't jump carzily fast
        } else {
          setState(() {
            charY = initialHeight - height; // note: not plus because 1 is bottom and -1 is up
          });
        }
        checkSkeleCoin();
      }));
    }
  }

  void moveRight() {
    direction = "right";
    checkSkeleCoin();
    Timer.periodic(Duration(milliseconds: 50), (timer) {
      checkSkeleCoin();
      if(Arrow.holdingButton == true && charX<0.98) {
        setState(() {
          charX += 0.02;
          running = !running;
        });
      } else {
        timer.cancel();  // stops character when user doesn't hold button
      }
    });
  }

  void moveLeft() {
    direction = "left";
    checkSkeleCoin();
     Timer.periodic(Duration(milliseconds: 50), (timer) {
      checkSkeleCoin();
      if(Arrow.holdingButton == true && charX>-0.98) {
        setState(() {
          charX -= 0.02;
          running = !running;
        });
      } else {
        timer.cancel();
      }
    });
  }

  // let skeleton moves towards the player
  @override
  void initState() {
    super.initState();
    checkSkeleCoin();
    Timer.periodic(Duration(milliseconds: 100), (timer) {
      checkSkeleCoin();
      if (skeleX != 100) {
        setState(() {
          if (skeleX > charX) {
            skeleX -= 0.01;
          } 
          else if (skeleX < charX) {
            skeleX += 0.01;
          }
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // reset when game over
    if (life == 0) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text("GAME OVER", style: font),
              SizedBox(height: 20),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black
                ),
                onPressed: () {
                  setState(() {
                    life = 5;
                    coin = 0;
                    charX = -0.5;
                    skeleX = 0.5;
                  });
                },
                child: Text("Restart", style: font),
              )
            ],
          ),
        ),
      );
    }
    else if (coin == 5) {
      return Scaffold(
        backgroundColor: const Color.fromARGB(255, 169, 194, 32),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text("You Win!", style: font),
              SizedBox(height: 20),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color.fromARGB(255, 169, 194, 32)
                ),
                onPressed: () {
                  setState(() {
                    life = 5;
                    coin = 0;
                    charX = -0.5;
                    skeleX = 0.5;
                  });
                },
                child: Text("Play again?", style: font),
              )
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: Column(
        children: [
          // Sky part
          Expanded(  
            flex: 4,
            child: Stack(  // stack: children will render in order, from topleft to bottom right
              children: [
                Container(
                  color: const Color.fromARGB(255, 39, 122, 225),
                  child: AnimatedContainer(
                    duration: Duration(milliseconds: 0),
                    alignment: Alignment(charX, charY),
                    child: jumping ? JumpingChar(direction: direction,) : Character(direction: direction, running: running,)
                  ),
                ),
                Container(
                  alignment: Alignment(skeleX, skeleY),
                  child: Skeleton()
                ),
                Container(
                  alignment: Alignment(coinX, coinY),
                  child: Coin()
                ),
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      Column(children: [Text("Life", style: font,), SizedBox(height: 8), Text("$life", style: font,)]),
                      Column(children: [Text("Level", style: font,), SizedBox(height: 8), Text("1-1", style: font,)]),
                      Column(children: [Text("Coins", style: font,), SizedBox(height: 8), Text("$coin", style: font,)])
                    ],
                  ),
                )
              ],
            )
          ),
          // Ground part
          Expanded(  
            flex: 1,
            child: Container(
              color: const Color.fromARGB(255, 78, 24, 5),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Arrow(leftFunction: moveLeft, child: Icon(Icons.arrow_back)),
                  Arrow(jumpFunction: jump, child: Icon(Icons.arrow_upward)),
                  Arrow(rightFunction: moveRight, child: Icon(Icons.arrow_forward)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

### refactored

```dart
// game_controller.dart

class GameObject {
  double x;
  double y;

  GameObject(this.x, this.y);

  bool collidesWith(GameObject other) {
    return (x - other.x).abs() < 0.05 && (y - other.y).abs() < 0.05;
  }
}

class GameController {
  static const double hiddenPosition = 100;
  static const double leftLimit = -0.98;
  static const double rightLimit = 0.98;
  static const double moveStep = 0.02;
  static const int maxLife = 5;
  static const int coinsToWin = 5;

  final player = GameObject(-0.5, 1);
  final skeleton = GameObject(0.5, 1);
  final coinObject = GameObject(0, 0.7);

  double jumpTime = 0;
  double initialHeight = 1;
  String direction = "right";
  bool running = false;
  bool jumping = false;
  int life = maxLife;
  int coins = 0;

  bool get isGameOver => life == 0;
  bool get hasWon => coins == coinsToWin;

  double randomPosition() {
    return -0.8 + (1.6 * Random().nextDouble());
  }

  void reset() {
    life = maxLife;
    coins = 0;
    direction = "right";
    running = false;
    jumping = false;
    jumpTime = 0;

    player.x = -0.5;
    player.y = 1;
    skeleton.x = 0.5;
    skeleton.y = 1;
    coinObject.x = 0;
    coinObject.y = 0.7;
  }

  void startJump() {
    jumping = true;
    jumpTime = 0;
    initialHeight = player.y;
  }

  void updateJump() {
    jumpTime += 0.02;
    final height = -3.5 * jumpTime * jumpTime + 5 * jumpTime;

    if (initialHeight - height >= 0.99) {
      player.y = 1;
      jumping = false;
    } else {
      player.y = initialHeight - height;
    }
  }

  bool movePlayer(double step, String newDirection) {
    direction = newDirection;

    final nextX = player.x + step;
    final insideScreen = nextX > leftLimit && nextX < rightLimit;

    if (!insideScreen) return false;

    player.x = nextX;
    running = !running;
    return true;
  }

  void moveSkeletonTowardPlayer() {
    if (skeleton.x == hiddenPosition) return;

    if (skeleton.x > player.x) {
      skeleton.x -= 0.01;
    } else if (skeleton.x < player.x) {
      skeleton.x += 0.01;
    }
  }

  GameObject? checkCollisions() {
    if (player.collidesWith(skeleton)) {
      life -= 1;
      skeleton.x = hiddenPosition;
      return skeleton;
    }

    if (player.collidesWith(coinObject)) {
      coins += 1;
      coinObject.x = hiddenPosition;
      return coinObject;
    }

    return null;
  }

  void respawn(GameObject object) {
    object.x = randomPosition();

    if (object == coinObject) {
      object.y = -0.7 + (1.6 * Random().nextDouble());
    }
  }
}

// game_screen_builder.dart

class GameScreenBuilder {
  final GameController game;
  final TextStyle font;
  final VoidCallback onRestart;
  final VoidCallback onMoveLeft;
  final VoidCallback onJump;
  final VoidCallback onMoveRight;

  GameScreenBuilder({
    required this.game,
    required this.font,
    required this.onRestart,
    required this.onMoveLeft,
    required this.onJump,
    required this.onMoveRight,
  });

  Widget buildEndScreen({
    required String title,
    required String buttonText,
    required Color backgroundColor,
  }) {
    return Scaffold(
      backgroundColor: backgroundColor,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(title, style: font),
            const SizedBox(height: 20),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: backgroundColor),
              onPressed: onRestart,
              child: Text(buttonText, style: font),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildStats() {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          buildStatColumn("Life", "${game.life}"),
          buildStatColumn("Level", "1-1"),
          buildStatColumn("Coins", "${game.coins}"),
        ],
      ),
    );
  }

  Widget buildStatColumn(String label, String value) {
    return Column(
      children: [
        Text(label, style: font),
        const SizedBox(height: 8),
        Text(value, style: font),
      ],
    );
  }

  Widget buildGameScreen() {
    return Scaffold(
      body: Column(
        children: [
          Expanded(
            flex: 4,
            child: Stack(
              children: [
                Container(
                  color: const Color.fromARGB(255, 39, 122, 225),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 0),
                    alignment: Alignment(game.player.x, game.player.y),
                    child: game.jumping
                        ? JumpingChar(direction: game.direction)
                        : Character(
                            direction: game.direction,
                            running: game.running,
                          ),
                  ),
                ),
                Container(
                  alignment: Alignment(game.skeleton.x, game.skeleton.y),
                  child: Skeleton(),
                ),
                Container(
                  alignment: Alignment(game.coinObject.x, game.coinObject.y),
                  child: Coin(),
                ),
                buildStats(),
              ],
            ),
          ),
          Expanded(
            flex: 1,
            child: Container(
              color: const Color.fromARGB(255, 78, 24, 5),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Arrow(leftFunction: onMoveLeft, child: const Icon(Icons.arrow_back)),
                  Arrow(jumpFunction: onJump, child: const Icon(Icons.arrow_upward)),
                  Arrow(rightFunction: onMoveRight, child: const Icon(Icons.arrow_forward)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// homepage.dart

class _HomePageState extends State<HomePage> {
  final game = GameController();
  Timer? skeletonTimer;

  final font = GoogleFonts.pressStart2p(
    color: Colors.white,
    fontSize: 25,
  );

  void resetGame() {
    setState(() {
      game.reset();
    });
  }

  void respawnLater(GameObject object) {
    Future.delayed(const Duration(seconds: 2), () {
      setState(() {
        game.respawn(object);
      });
    });
  }

  void jump() {
    if (game.jumping) return;

    game.startJump();

    Timer.periodic(const Duration(milliseconds: 30), (timer) {
      GameObject? collidedObject;

      setState(() {
        game.updateJump();
        collidedObject = game.checkCollisions();

        if (!game.jumping) {
          timer.cancel();
        }
      });

      if (collidedObject != null) {
        respawnLater(collidedObject!);
      }
    });
  }

  void move(double step, String newDirection) {
    Timer.periodic(const Duration(milliseconds: 50), (timer) {
      GameObject? collidedObject;

      if (Arrow.holdingButton) {
        setState(() {
          final moved = game.movePlayer(step, newDirection);
          collidedObject = game.checkCollisions();

          if (!moved) {
            timer.cancel();
          }
        });

        if (collidedObject != null) {
          respawnLater(collidedObject!);
        }
      } else {
        timer.cancel();
      }
    });
  }

  void moveLeft() {
    move(-GameController.moveStep, "left");
  }

  void moveRight() {
    move(GameController.moveStep, "right");
  }

  @override
  void initState() {
    super.initState();

    skeletonTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      GameObject? collidedObject;

      setState(() {
        collidedObject = game.checkCollisions();
        game.moveSkeletonTowardPlayer();
      });

      if (collidedObject != null) {
        respawnLater(collidedObject!);
      }
    });
  }

  @override
  void dispose() {
    skeletonTimer?.cancel();
    super.dispose();
  }

  GameScreenBuilder createBuilder() {
    return GameScreenBuilder(
      game: game,
      font: font,
      onRestart: resetGame,
      onMoveLeft: moveLeft,
      onJump: jump,
      onMoveRight: moveRight,
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenBuilder = createBuilder();

    if (game.isGameOver) {
      return screenBuilder.buildEndScreen(
        title: "GAME OVER",
        buttonText: "Restart",
        backgroundColor: Colors.black,
      );
    }

    if (game.hasWon) {
      return screenBuilder.buildEndScreen(
        title: "You Win!",
        buttonText: "Play again?",
        backgroundColor: const Color.fromARGB(255, 169, 194, 32),
      );
    }

    return screenBuilder.buildGameScreen();
  }
}
```

### Explanation

The code is now separated into four main classes:
- `GameObject` stores the position of each object and checks collision.
- `GameController` contains the game state and game rules.
- `GameScreenBuilder` builds the repeated UI pieces, such as the game screen, stats display, and end screens.
- `_HomePageState` connects buttons/timers to the controller and asks the builder to create the UI, it no longer includes the detailed logic of how the game works.

This respects the single responsibility principle.