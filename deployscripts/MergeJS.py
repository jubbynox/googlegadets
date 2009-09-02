import glob
import gzip
import os
import sys

# Setup variables.
outputFilename = sys.argv[1]
inputRootPath = sys.argv[2]

def mergeJS(path, fout):
    # Run through JS files.
    for filename in glob.glob(os.path.join(path, '*.js') ):
        # Open file.
        print 'Merging: ' + filename
        fin = file(filename, 'rb')
        while True:
            data = fin.read(65536)
            if not data:
                break
            fout.write(data)
        fin.close()
        fout.write('\r\n')
      
    # Move into sub directories.
    """ for pathObj in os.listdir(path):
        if os.path.isdir(os.path.join(path, pathObj)) and '.svn' not in pathObj:
            print 'Moving into directory: ' + pathObj
            mergeJS(os.path.join(path, pathObj), fout) """
            
# Open output file.
fout = file(outputFilename, 'wb')
# Do the merging.
mergeJS(inputRootPath, fout)
# Close output file.
fout.close()