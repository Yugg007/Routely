package com.routely.user_service.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users") // table name
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // tells MySQL to auto-increment
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, unique = true, length = 15)
    private String mobileNo;

    @Column(nullable = false, length = 50)
    private String name;
    
    @Column
    private String isDriver;

    // ✅ Default constructor (required by JPA)
    public User() {}

    // ✅ Private constructor (used by Builder)
    private User(Builder builder) {
        this.id = builder.id;
        this.email = builder.email;
        this.password = builder.password;
        this.mobileNo = builder.mobileNo;
        this.name = builder.name;
    }

    // ✅ Builder Pattern
    public static class Builder {
        private Long id;
        private String email;
        private String password;
        private String mobileNo;
        private String name;
        private String isDriver;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder password(String password) {
            this.password = password;
            return this;
        }

        public Builder mobileNo(String mobileNo) {
            this.mobileNo = mobileNo;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }
        
        public Builder isDriver(String isDriver) {
        	this.isDriver = isDriver;
        	return this;
        }

        public User build() {
            return new User(this);
        }

		public String getIsDriver() {
			return isDriver;
		}

		public void setIsDriver(String isDriver) {
			this.isDriver = isDriver;
		}
    }

    // ✅ Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getMobileNo() {
        return mobileNo;
    }

    public void setMobileNo(String mobileNo) {
        this.mobileNo = mobileNo;
    }

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getIsDriver() {
		return isDriver;
	}

	public void setIsDriver(String isDriver) {
		this.isDriver = isDriver;
	}

}
