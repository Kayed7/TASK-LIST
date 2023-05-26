//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 3000;
const mongoose = require("mongoose");
const { name } = require("ejs");
const date = require(__dirname + "/date.js");
require("dotenv").config();
const atlasUrl = process.env.ATLAS_URL;
console.log(process.env.ATLAS_URL);
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
/*Mongo Atlas Connection*/ 
mongoose.connect(atlasUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const ItemSchema = new mongoose.Schema({
  name: String,
});

const ItemModel = mongoose.model("Item", ItemSchema);

const defaultItems = [
  { name: "Fruits" },
  { name: "Vegetables" },
  { name: "Meat" },
];

const ListSchema = {
  name: String,
  items: [ItemSchema],
};
const List = mongoose.model("List", ListSchema);
app.get("/", async function (req, res) {
  try {
    const itemsList = await ItemModel.find({});
    if (itemsList.length === 0) {
      await ItemModel.insertMany(defaultItems);
      console.log("Successfully saved default items to DB.");
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: itemsList });
    }
  } catch (err) {
    console.error(err);
  }
});


app.post("/", async function (req, res) {
  const item = req.body.newItem;
  const listName = req.body.list;

  const newItem = new ItemModel({
    name: item,
  });

  if (listName === "Today") {
    // handle today list
    await newItem.save();
    res.redirect("/");
  } else {
    // handle default list
    List.findOne({ name: listName })
      .then(async function (foundList) {
        foundList.items.push(newItem);
        await foundList.save();
        res.redirect("/" + listName);
      })
      .catch(function (err) {});
  }
});


app.post("/delete", async function (req, res) {
  const selectedItemIds = req.body.itemId; // Get the selected item IDs as an array
  const listName = req.body.listName;

  if (listName == "Today") {
    if (selectedItemIds) {
      // If only a single item is selected, convert it to an array
      const selectedItems = Array.isArray(selectedItemIds) ? selectedItemIds : [selectedItemIds];

      // Iterate over each selected item and remove it
      for (const itemId of selectedItems) {
        await ItemModel.findByIdAndRemove(itemId);
        console.log('Item removed successfully:', itemId);
      }

      res.redirect("/");
    }
  } else {
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: selectedItemIds } } }
    );
    res.redirect("/" + encodeURIComponent(listName));
  }
});


app.get("/:customListName", async function (req, res) {
  const customListName = req.params.customListName.charAt(0).toUpperCase() + req.params.customListName.slice(1).toLowerCase();
  // Check if a list with the given name exists in the database, if not creat one
  await List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();
        console.log("saved");
        res.redirect("/" + customListName); // Redirect the user to the new list's page
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch(function (err) {
      console.log("Error fail saving new list to the database:", err);
    });
});

app.get("/about", function (req, res) {
  res.render("about");
}); 
//app.listen(process.env.PORT);`
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server has started Successfully");
});
