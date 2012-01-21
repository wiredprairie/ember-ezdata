class Person < ActiveRecord::Base
  has_many  :gifts_given , :class_name => "Gift", :foreign_key => "from_person_id"
  has_many  :gifts, :foreign_key => "to_person_id"
end
