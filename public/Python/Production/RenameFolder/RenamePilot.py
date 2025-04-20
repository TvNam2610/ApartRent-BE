import os
from datetime import datetime
import shutil
import datetime as dt

def get_date_format(date):
    year=date[0:4]
    month=date[5:7]
    day=date[8:10]
    return year+month+day

if __name__=="__main__":
    source='C:\\Realtime\\Pilot\\'
    lastmonth=(dt.date.today() + dt.timedelta(-14)).strftime('%Y-%m-%d')
    try:
        today=datetime.now().strftime('%Y-%m-%d')
        date=get_date_format(today)
        deldate=get_date_format(lastmonth)
        destination='C:\\Realtime\\'+date
        os.rename(source, destination)
        os.mkdir(source)
        entries=os.listdir(destination)
        for r, d, f in os.walk(destination):
            for direct in d:
                dirPath=os.path.join(r, direct)
                dirPath=dirPath.replace(date,'Pilot')
                os.mkdir(dirPath)
        try:
            dest_1= 'E:\\Scan\\'+date
            dest_2='C:\\Realtime\\'+deldate
            destination_1 = shutil.copytree(destination, dest_1)
            try:
                destination_2 = shutil.rmtree(dest_2)
            except:
                print("error delete folder last day!")
        except:
            print("error copy backup to hard disk")
        print('done')
    except:
        print('cant rename folder, change to moving file')
        today=datetime.now().strftime('%Y%m%d')
        source= 'C:\\Realtime\\Pilot\\'
        dest1 = 'C:\\Realtime\\Backup\\'+today
        os.mkdir(dest1)
        entries=os.listdir(source)
        for r, d, f in os.walk(source):
            for direct in d:
                dirPath=os.path.join(r, direct)
                dirPath=dirPath.replace('Pilot', '\\Backup\\'+today)
                os.mkdir(dirPath)
        t=0
        for r, d, f in os.walk(source):
            for entry in f:
                if 'done' in entry:
                    try:
                        sourcePath=os.path.join(r, entry)
                        destinationPath=sourcePath.replace('Pilot', '\\Backup\\'+today)
                        shutil.move(sourcePath, destinationPath)
                    except:
                        t=t+1
        if t<5:
            print('done rename file!')
        else:
            print('fail')
    
