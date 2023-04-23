const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

const userRoutes = require('./user');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');

const app = express();
const port = 3000;

const { Liquid } = require('liquidjs');
const engine = new Liquid();
app.engine('liquid', engine.express());
app.set('views', './views');            // specify the views directory
app.set('view engine', 'liquid');       // set liquid to default
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static('./'));

/**
 * Блок инициализации БД.
 * 
 * В данном блоке происходит подключение к БД, проверка подключения, а также создание моделей.
 */

// Формат ссылки: движок://логин:пароль@хост:порт/базаданных.
const sequelize = new Sequelize('postgres://postgres:Bahfbv!1037@localhost:5432/postgres');

// Обернем функцию аутентификации в асинхронную.
const authenticate = async () => {
    try {
        await sequelize.authenticate();
        console.log("Есть контакт.");
    } catch (error) {
        console.error("Хьюстон, у нас проблема:", error);
    }
};

// Проверяем подключение к БД.
authenticate();

/**
 * Модель пользователя, содержит поля:
 * login - логин пользователя | строка
 * name - имя | строка
 * password - пароль | строка
 * isAdmin - флаг, характеризующий наличие у пользователя админских прав | boolean
 */
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

/**
 * Модель поста, содержит поля:
 * userID - ID пользователя | внешний ключ на User
 * content - содержание поста | строка
 */
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

/**
 * Блок авторизации.
 * 
 * В данном блоке реализована авторизация пользователей.
 */

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    async function (username, password, done) {
        const user = await User.findOne({ where: { login: username } });
        console.log(user);
        if (user && user.password == password) {
            done(null, {
                id: user.id,
                login: user.login,
                name: user.name,
                isAdmin: user.isAdmin
            });
        } else {
            done(null, false);
        }
    }
));

function auth(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', passport.authenticate('local',
    {
        failureRedirect: '/login'
    }),
    (req, res) => {
        // NOT OK
        res.redirect('/');
    });

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/login');
    })
});

app.get('/admin', (req, res) => {
    res.render('admin', {
        role: req.user.role,
        userList: userList
    });
});

app.get('/', auth, async (req, res) => {
    const posts = await Post.findAll({ include: User, order: [['id', 'DESC']] });
    res.render('home', {
        name: req.user.name,
        userID: req.user.id,
        isAdmin: req.user.isAdmin,
        posts: posts
    });
});

app.post('/create', async (req, res) => {
    const post = new Post();
    post.userID = req.user.id;
    post.content = req.body.content;
    await post.save();
    res.redirect('/');
});

app.post('/edit', async (req, res) => {
    const postToEditID = Object.keys(req.body)
        .filter(x=>x.startsWith('edit_'))
        .map(x=>x.split('_')[1])[0];

    const newContent = req.body['edit_'+postToEditID];

    console.log(postToEditID, newContent);

    await Post.update({ content: newContent }, {
        where: {
          id: postToEditID
        }
      });
    
    //const postToDel = await Post.findByPk(postToDelID);
    //await postToDel.destroy();

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

app.post('/delete', async (req, res) => {
    const postToDelID = Object.keys(req.body)
        .filter(x=>x.startsWith('delete_'))
        .map(x=>x.split('_')[1])[0];
    
    const postToDel = await Post.findByPk(postToDelID);
    await postToDel.destroy();

    res.redirect('/');
});

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

// User.sync({force:true});
// Post.sync({force:true});
app.use('/user', auth, userRoutes);

app.listen(port, () => console.log('started'));