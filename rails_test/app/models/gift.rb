class Gift < ActiveRecord::Base
  belongs_to :from_person, :class_name => "Person", :foreign_key => "from_person_id"
  belongs_to :to_person, :class_name => "Person", :foreign_key => "to_person_id"
end
