const express = require('express');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const port = 3000;

var { Liquid } = require('liquidjs');
var engine = new Liquid();
app.use(bodyParser.urlencoded());
app.engine('liquid', engine.express());
app.set('views', './views');            // specify the views directory
app.set('view engine', 'liquid');       // set liquid to default


const sequelize = new Sequelize('postgres://postgres:Bahfbv!1037@localhost:5432/postgres');

const authenticate = async () => {
    try {
      await sequelize.authenticate();
      console.log("Connection has been established successfully.");
    } catch (error) {
      console.error("Unable to connect to the database:", error);
    }
};

authenticate();

const User = sequelize.define('User', {
    login: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});

const Post = sequelize.define('Post', {
    userID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Задание внешнего ключа (соотношение 1:M).
User.hasMany(Post, { foreignKey: 'userID' }); // У пользователя может быть много постов
Post.belongsTo(User, { foreignKey: 'userID' }); // Пост принадлежит пользователю

app.get('/', async (req, res) => {
    // const tasks = await Task.findAll();
    // const model = {
    //     active: tasks.filter(x => !x.completed)
    //         .map(x => x.get({plain:true})),
    //     completed: tasks.filter(x => x.completed)
    //         .map(x => x.get({plain:true}))
    // }
    res.render('home');
});

app.post('/create', async (req, res) => {
    // const task = new Task();
    // task.name = req.body.name;
    // await task.save();
    res.redirect('/');
});

app.post('/update', async (req, res) => {
    // const completedKeys = Object.keys(req.body)
    //     .filter(x=>x.startsWith('complete_'))
    //     .map(x => x.split('_')[1]);

    // for (let id of completedKeys) {
    //     const task = await Task.findByPk(id);
    //     task.completed = true;
    //     await task.save();
    // }

    // const deletedKeys = Object.keys(req.body)
    //     .filter(x=>x.startsWith('delete_'))
    //     .map(x => x.split('_')[1]);

    // for (let id of deletedKeys) {
    //     const task = await Task.findByPk(id);
    //     await task.destroy();
    // }

    res.redirect('/');
});

// User.sync({force:true});
// Post.sync({force:true});

app.listen(port, () => console.log('started'));