##Overview
This example demonstrates [access control](http://docs.strongloop.com/display/LB/Authentication+and+authorization) in [LoopBack](http://loopback.io).

##Prerequisites

Before starting, make sure you've followed [Getting Started with LoopBack](http://docs.strongloop.com/display/LB/Getting+started+with+LoopBack) to install Node and LoopBack. You will also need a basic understanding  of [LoopBack models](http://docs.strongloop.com/display/LB/Working+with+models).

##Procedure

Follow the steps below to create the application from scratch.  Doing this will give you a better understanding
of how to implement access control in your own app.

Otherwise, if you just want to see the example in action, do this:

```shell
$ git clone https://github.com/strongloop/loopback-example-access-control.git
$ cd loopback-example-access-control
$ npm install
$ slc run
```

1. **Create the app**.

  Run `slc loopback`, and name the app `loopback-example-access-control`.

2. **Create the account model**.

  Run `slc loopback:model account` to create the *account* model. Expose the model via REST, leave the default plural form and give it the following properties:

  |Property name|Property type|Required|
  |:-:|:-:|:-:|
  |id|Number|Yes|
  |type|String|Yes|

3. **Add accounts**.

  Copy the [`add-accounts.js`](/server/boot/add-accounts.js) script to `server/boot` to add accounts.

4. **Verify accounts exist**.

  Run `curl localhost:3000/api/accounts`. You will see:
  ```shell
...
[{"id":1,"type":"chequing"},{"id":2,"type":"savings"}]
...
```

  There are two accounts, *checking* and *savings*. Notice you have full access to all [predefined remote methods](http://docs.strongloop.com/display/LB/Exposing+models+over+a+REST+API#ExposingmodelsoveraRESTAPI-Predefinedremotemethods) by default.

  >**NOTE**:You can add `app.set('json spaces', 2)` in `server/server.js` to get pretty printed output. In that case, you will see this instead:

  ```shell
...
[
  {
    "id": 1,
    "type": "chequing"
  },
  {
    "id": 2,
    "type": "savings"
  }
]
...
```

5. **Restrict access to all resources via ACL**.

  Run `slc loopback:acl` to create an ACL with the following properties:
   ```shell
...
[?] Select the model to apply the ACL entry to: account
[?] Select the ACL scope: All methods and properties
[?] Select the access type: All (match all types)
[?] Select the role: All users
[?] Select the permission to apply: Explicitly deny access
...
```

  This ACL denies access to all [remote methods](http://docs.strongloop.com/display/LB/Exposing+models+over+a+REST+API#ExposingmodelsoveraRESTAPI-Predefinedremotemethods) for all users.

  > **NOTE**: Each access type refers to a set of resources. For example, the *read* access type applies to the following remote methods: create, upsert, exists, findById, etc. See the [access type documentation](http://docs.strongloop.com/display/LB/Controlling+data+access#Controllingdataaccess-Useraccesstypes) for more information.

6. **Test the ACL**.

  Run `curl localhost:3000/api/accounts` and you should see:
  ```shell
...
{"error":{"name":"Error","status":401,"message":"Authorization Required","statusCode":401,"stack":"Error: Authorization Required\n    at ...}}
...
```
  As you can see, the app denies access to the resource.

7. **Allow a specific remote method**.

  Run `slc loopback:acl` and apply the following:
  ```shell
[?] Select the model to apply the ACL entry to: account
[?] Select the ACL scope: A single method
[?] Enter the method name: find
[?] Select the access type: All (match all types)
[?] Select the role: All users
[?] Select the permission to apply: Explicitly grant access
```

  This enables you to retrieve accounts again. Run `curl localhost:3000/api/accounts` and you'll see this again:
  ```shell
...
[{"id":1,"type":"chequing"},{"id":2,"type":"savings"}]
...
```

##More information

For more information, see the [ACL documentation](http://docs.strongloop.com/display/LB/Authentication+and+authorization).
