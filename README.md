# Run the app
1. clone the repo to local machine; make sure that you have installed nodejs 16.x
2. run `npm i` to install dependencies
3. run `cp .env.example .env`
4. run `npm start` to run the server
5. play with the app on `localhost:4567`

# Task
+ 1. As a user, I want to see the files and the folders located in a source folder
+ 2. The list should be ordered by size.
+ 3. For every element I want to see the path, the size and the last modification date.
+ 4. Finally, a count of the files and the total size of the source folder should be provided.
5. Develop a web app that allow the user to choose a folder, and show the result
+ 6. The application should scan subfolders recursively.

# Q&A
- What is the source folder? Is it some /source folder from root of the project or just root of the project?
- When I have source_folder that contains folder1 & file1.txt. And folder1 contains file2.txt & file3.txt. After clicking on folder1 what should I see? (Only 2 files: folder1/file2.txt & folder1/file3.txt?)
- a count of the files and the total size of the source folder should be different depending on selected inner folder?
- What is allowed to be used in my app? (libs, tools or just simple JS?)
