const express = require("express")
,     bodyParser = require("body-parser")
,     exphbs = require("express-handlebars")
,     mongoose = require("mongoose")
,     methodOverride = require("method-override")
,     path = require("path")
,     sharp = require("sharp");

// upload img
const multer  = require("multer");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads')
    },
    filename: ((req, file, cb) => {
        const ext = path.extname(file.originalname);
        const date = Date.now();
        cb(null, date + '-' + file.originalname)
        //cb(null, file.originalname + '-' + date + ext)
    })
})

//const upload = multer({ dest: 'uploads/' });
const upload = multer({ storage: storage,
    //limite de taille Mo ou résolution ex:1024x1024
    limits: {
        fieldSize : 10 * 3096 * 3096,
        files : 1,
    },
    // Filtre extension
    fileFilter : ((req, file, cb) => {
        if (file.mimetype === "image/png" || 
            file.mimetype === "image/jpeg" || 
            file.mimetype === "image/jpg" || 
            file.mimetype === "image/gif") {
            cb(null, true)
        } else {
            cb(new Error("Need format png, jpg, jpeg or gif."))
        } 
    })
});

// Express
const app = express();

// Express static
app.use(express.static('public'));

// methodOverride
app.use(methodOverride("_method"));

// bodyParser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// handlebars
app.engine('handlebars', exphbs({ extname: '.handlebars' }));
app.set('view engine', 'handlebars');

//mongoDb mangoose
mongoose.connect('mongodb://localhost:27017/test', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
});

// Schema Obj
const articleSchema = {
    title: String,
    content: String,
    cover: {
        name: String,
        originalName: String,
        path: String,
        urlSharp: String,
        createAt: Date
    }
};

const article = mongoose.model("article", articleSchema);

// Route home
app.route('/')
// GET
.get((req, res) => {
    article.find((err, article) => {
        if (!err) {
            res.render('home', {
                article : article
            })
        } else {
            res.send(err);
        }
    })
})

// POST
.post(upload.single('cover'), (req, res) => {
    const file = req.file;
    //console.log(file);

    sharp(file.path)
        .resize(350)
        .webp({quality: 80})
        .toFile("./public/uploads/web/" + file.originalname.split('.').slice(0, -1).join('.') + ".webp", (err, info) => { });

    const newArticle = new article ({
        title : req.body.title,
        content : req.body.content
    });

    if (file) {
        newArticle.cover = {
            name: file.filename,
            originalName: file.originalname,
            path: file.path.replace("public", ""),
            urlSharp: "/uploads/web/" + file.originalname.split('.').slice(0, -1).join('.') + ".webp" ,
            createAt: Date.now()
        }
    }

    newArticle.save((err) => {
        if(!err){
            res.redirect('/');
        } else {
            res.send(err);
        }
    })
})

// Route Add Obj
app.get('/edition', (req, res) => {
    res.render('edition');
})


// Route update
app.route('/update', (req, res) => {
    res.render('/update')
})

app.get('/update/:id', (req, res) => {
    article.findOne({_id: req.params.id}, (err, article) => {
        if (!err) {
            res.render('update', {
                _id: article.id,
                title: article.title,
                content: article.content
            });
        } else {
            res.send(err);
        }
    })
})

// PUT
.put('/update/:id', (req, res) => {
    article.update(
        //condition
        {_id : req.params.id},
        //update
        {
            title : req.body.title,
            content : req.body.content
        },
        //option
        {multi : true},
        //execution
        function(err) {
            if(!err){
                res.redirect('/');
            } else {
                res.send(err);
            }
        }
    )
})

// DELETE One
.delete('/update/:id', (req, res) => {
    article.deleteOne({_id: req.params.id}, (err) => {
        if(!err){
            res.redirect('/');
        } else {
            res.send(err);
        }
    })
})

//Specifié un port serveur
app.listen(4000, function() {
    console.log(`Server started on port 4000, ${new Date().toLocaleString()}`);
});