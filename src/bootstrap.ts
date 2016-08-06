class HelloWorld {
  constructor() {
    console.log("construct");
  }

  sayHello() {
    console.log("hello from the application");
  }
}

(new HelloWorld()).sayHello()
