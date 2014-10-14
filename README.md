#Overview
This example demonstrates authentication and authorization using [LoopBack](http://loopback.io) access controls.

#Prerequisites
Before starting, makes sure you've followed [Getting Started with LoopBack](http://docs.strongloop.com/display/LB/Getting+started+with+LoopBack) to install Node and LoopBack. Familiarize yourself with [LoopBack authentication and authorization](http://docs.strongloop.com/display/LB/Authentication+and+authorization) before starting this tutorial. You will also need knowledge of:

- [body-parser](https://github.com/visionmedia/ejs)
- [EJS](https://github.com/expressjs/body-parser)
- [JSON](http://json.org/)

#Procedure
Run the following to see the example in action:
```
git clone https://github.com/strongloop/loopback-example-access-control
cd loopback-example-access-control
npm install
slc run
```

Otherwise, follow the steps below to create the application from scratch.

1. **Getting started.**

    You will build an app named *Startkicker* (a Kickstarter clone). The
    app consists of four types of users: `guest`, `owner`, `team member` and
    `administrator`. Each user type has access to various parts of the app
    based on their role and the ACLs we define.

2. **Bootstrap the app.**

    Run `slc loopback` and name the app `loopback-example-access-control`.

3. **Create the models.**

    Run `slc loopback:model` and create the following models:

    - `user`
      - Data source: db (memory)
      - Expose via REST: No
      - Properties:
        - None (we will extend the `User` model)
    - `team`
      - Data source: db (memory)
      - Expose via REST: No
      - Properties:
        - ownerId | Number | Required
        - memberId | Number | Required
    - `project`
      - Data source: db (memory)
      - Expose via REST: Yes
      - Custom plural form: leave blank, defaults to `projects`
      - Properties:
        - name | String | Not required
        - balance | Number | Not required

    Next, extend the `user` model by changing the `base` property in
    `common/models/user.json` from `PersistedModel` to `User`. Then copy
    [`project.js`](/common/models/project.js) to `common/models/project.js` to
    add custom REST endpoints to the app.

    >Custom REST endpoints are known in LoopBack as [remote methods](http://docs.strongloop.com/display/LB/Defining+remote+methods).

4. **Create the model relations.**

    Run `slc loopback:relation` and create the following relations:

    - `user`
      - has many `project`
        - Property name for the relation: projects
        - Custom foreign key: ownerId
      - has many `team`
        - Property name for the relation: teams
        - Custom foreign key: ownerId
    - `team`
      - has many `user`
        - Property name for the relation: members
        - Custom foreign key: memberId
    - `project`
      - belongs to `user`
        - Property name for the relation: user
        - Custom foreign key: ownerId

5. **Add model instances.**

    Copy [`create-model-instances.js`](/server/boot/create-model-instances.js)
    into `server/boot`. This script does the following:

    - Creates 3 users (John, Jane, and Bob)
    - Creates project 1, sets John as the owner of the project, and adds John and
      Jane as team members of project 1
    - Creates project 2, sets Jane as the owner of the project, and add Jane as a
      team member of project 2
    - Creates a role name admin and add a role mapping to make bob an admin

6. **Add code to serve views.**

    - Delete `server/boot/root.js`
    - Create a directory in `server` name `views`
    - Configure debug for logging messages
      - From the project root, run `npm install --save debug`
    - Configure EJS and [body-parser](https://github.com/expressjs/body-parser)
      - From the project root, run `npm install --save ejs`
      - From the project root, run `npm install --save body-parser`
      - Modify `server/server.js` to look like:

        ```js
        ...
        // -- Add your pre-processing middleware here --
        var bodyparser = require('body-parser');
        app.use(bodyparser.urlencoded({ extended: true }));
        ...
        // -- Mount static files here--
        ...
        var path = require('path');
        app.set('views', path.join(__dirname, 'views'));
        app.set('view engine', 'html');
        app.engine('html', require('ejs').renderFile);
        app.set('json spaces', 2); //pretty print json responses
        ...
        ```

7. **Add routes.**

    Copy [`routes.js`](/server/boot/routes.js) into `server/boot`. This script
    does the following:

    - Sets the `GET /` route to render `server/views/index.html`
    - Sets the `GET /projects` route to render `server/views/projects.html`
    - Sets the `POST /projects` route to to render `projects.html` when
      credentials are valid and renders `server/views/index.html` when
      credentials are invalid
    - Sets the `GET /logout` route to log the user out

    >When you log in sucessfully, `projects.html` is rendered with the
    >authenticated user's access token embedded into each link.

8. **Create the views.**

    The project will use two views `index.html` and `projects.html`. Perform the
    following:

    - Copy [`index.html`](/server/views/index.html) into `server/views`.
    - Copy [`projects.html`](/server/views/projects.html) into `server/views`.

    >We will go over the details of these two files in a later step.

9. **Create role resolver**

    Copy [`create-role-resolver.js`](/server/boot/create-role-resolver.js) to
    `server/boot`. In this file, we check if the context related to the project
    model and if the request maps to a user. If these two requirements are not
    met, we deny the request. If the requirements are met, we check if the user
    is a team member and process the request accordingly.

10. **Create ACLs.**

    ACLs are used to restrict access to the app REST endpoints. From the project
    root, run `slc loopack:acl` and create each of the following ACL entries
    for the `project` model:

    - Deny access to all project REST endpoints
      - Select the model to apply the ACL entry to: **All existing models**
      - Select the ACL scope: **All methods and properties**
      - Select the access type: **All (match all types)**
      - Select the role: **All users**
      - Select the permission to apply: **Explicitly deny access**

    - Allow unrestricted access to `GET /api/projects/listProjects`
      - Select the model to apply the ACL entry to: **project**
      - Select the ACL scope: **A single method**
      - Enter the method name: **listProjects**
      - Select the access type: **Execute**
      - Select the role: **All users**
      - Select the permission to apply: **Explicitly grant access**

    - Only allow admin unrestricted access to `GET /api/projects`
      - Select the model to apply the ACL entry to: **project**
      - Select the ACL scope: **A single method**
      - Enter the method name: **find**
      - Select the access type: **Read**
      - Select the role: **other**
      - Enter the role name: **admin**
      - Select the permission to apply: **Explicitly grant access**

    - Only allow team members access to `GET /api/projects/:id`
      - Select the model to apply the ACL entry to: **project**
      - Select the ACL scope: **A single method**
      - Enter the method name: **findById**
      - Select the access type: **Read**
      - Select the role: **other**
      - Enter the role name: **teamMember**
      - Select the permission to apply: **Explicitly grant access**

    - Allow authenticated users to access `POST /api/projects/donate`
      - Select the model to apply the ACL entry to: **project**
      - Select the ACL scope: **A single method**
      - Enter the method name: **donate**
      - Select the access type: **Execute**
      - Select the role: **Any authenticated user**
      - Select the permission to apply: **Explicitly grant access**

    - Allow owners access to `POST /api/projects/withdraw`
      - Select the model to apply the ACL entry to: **project**
      - Select the ACL scope: **A single method**
      - Enter the method name: **withdraw**
      - Select the access type: **Execute**
      - Select the role: **The user owning the object**
      - Select the permission to apply: **Explicitly grant access**

11. **Start the app.**

  From the project root, run `slc run` and open [localhost:3000](http://localhost:3000)
  in your browser to view the app. You will notice logins and explanations
  related to each user type we created:

  - Guest - Guest
    - Role = $everyone, $unauthenticated
    - Has access to the "List projects" function, but none of the others
  - John - Project owner
    - Role = $everyone, $authenticated, teamMember, $owner
    - Can access all functions except "View all projects"
  - Jane - Project team member
    - Role = $everyone, $authenticated, teamMember
    - Can access all functions except "View all projects" and "Withdraw"
  - Bob - Administator
    - Role = $everyone, $authenticated, admin
    - Can access all functions except "Withdraw"
